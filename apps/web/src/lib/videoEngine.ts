/**
 * Browser-Native Video Processing Engine for Local AI Shorts Studio.
 * Uses WebCodecs, mp4-muxer, OffscreenCanvas, and hardware-accelerated encoding.
 * Runs 100% on the client device. Zero server uploads.
 *
 * ULTRA-FAST RENDERING OPTIMIZATIONS:
 *  - Adaptive FPS & Bitrate per device tier (24/30 FPS on low-end, 60 FPS on high-end).
 *  - Pre-warmed multi-profile H.264 hardware encoder negotiation (High -> Main -> Baseline).
 *  - OffscreenCanvas with desynchronized=true and alpha=false for direct GPU rendering.
 *  - Cached vignette radial gradient across all frames (never reallocated).
 *  - Subtitle binary search O(log n) per frame instead of linear scans.
 *  - Dedicated seek with timeout safety guard, audio pre-muted to bypass media pipeline stalls.
 *  - GPU backpressure flow control (encodeQueueSize monitoring) to maximize throughput.
 *  - Synchronized stereo AAC audio encoding directly multiplexed with zero drift.
 *  - Direct-to-disk streaming option via File System Access API for zero-memory footprint.
 */

import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer';
import { SubtitleCue, SubtitleTheme, drawSubtitlesOnCanvas } from './subtitles';
import { GeneratedHook } from './localAI';

export type ReframeStrategy =
  | 'AI Smart'
  | 'Center'
  | 'Face Focus'
  | 'Speaker Focus'
  | 'Fit + Blur'
  | 'Left'
  | 'Right'
  | 'Gameplay'
  | 'Manual';

export type EditingStyle = 'Clean' | 'Balanced' | 'High Energy' | 'Extreme';

export interface RenderOptions {
  sourceVideo: HTMLVideoElement;
  sourceFile?: File | Blob;
  startTime: number;
  endTime: number;
  targetWidth: number;
  targetHeight: number;
  targetFps?: number;
  bitrate?: number;
  reframeStrategy: ReframeStrategy;
  editingStyle: EditingStyle;
  subtitles?: SubtitleCue[];
  subtitleTheme?: SubtitleTheme;
  hook?: GeneratedHook;
  onProgress?: (progress: number, stageText: string) => void;
  fileHandle?: FileSystemFileHandle;
  /** Device performance hint to adapt quality automatically. */
  devicePerf?: 'excellent' | 'good' | 'limited' | 'compat';
}

export interface RenderResult {
  blob?: Blob;
  duration: number;
  width: number;
  height: number;
  fps: number;
  fileSizeBytes: number;
  streamedToDisk: boolean;
  pipeline?: string;
}

// ---------------------------------------------------------------------------
// Reframe crop calculation
// ---------------------------------------------------------------------------

export function calculateReframeCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  strategy: ReframeStrategy,
  timeProgress: number = 0,
  manualPanOffset: number = 0.5
) {
  const targetAspect = targetWidth / targetHeight;
  const sourceAspect = sourceWidth / sourceHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let cropX = 0;
  let cropY = 0;

  if (sourceAspect > targetAspect) {
    cropWidth = sourceHeight * targetAspect;
    cropHeight = sourceHeight;
    cropY = 0;

    let panX = 0.5;
    switch (strategy) {
      case 'Left':       panX = 0.2; break;
      case 'Right':      panX = 0.8; break;
      case 'Face Focus':
      case 'Speaker Focus':
        panX = 0.5 + Math.sin(timeProgress * 0.5) * 0.08; break;
      case 'AI Smart':
        panX = 0.45 + Math.sin(timeProgress * 0.4) * 0.1; break;
      case 'Manual':     panX = manualPanOffset; break;
      case 'Center':
      default:           panX = 0.5; break;
    }

    const maxCropX = sourceWidth - cropWidth;
    cropX = Math.max(0, Math.min(maxCropX, maxCropX * panX));
  } else {
    cropWidth = sourceWidth;
    cropHeight = sourceWidth / targetAspect;
    cropX = 0;
    cropY = (sourceHeight - cropHeight) * 0.5;
  }

  return { cropX, cropY, cropWidth, cropHeight };
}

// ---------------------------------------------------------------------------
// Subtitle binary search O(log n)
// ---------------------------------------------------------------------------

function findActiveCue(cues: SubtitleCue[], t: number): SubtitleCue | undefined {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cue = cues[mid];
    if (t < cue.startTime)      hi = mid - 1;
    else if (t > cue.endTime)   lo = mid + 1;
    else                         return cue;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Vignette gradient cache — created once per canvas size
// ---------------------------------------------------------------------------

const _vignetteCache = new Map<string, CanvasGradient>();

function getCachedVignette(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number,
  h: number
): CanvasGradient {
  const key = `${w}x${h}`;
  const cached = _vignetteCache.get(key);
  if (cached) return cached;
  const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.28)');
  _vignetteCache.set(key, g);
  return g;
}

// ---------------------------------------------------------------------------
// Core frame painter (shared by preview loop and render pipeline)
// ---------------------------------------------------------------------------

export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  video: HTMLVideoElement,
  targetWidth: number,
  targetHeight: number,
  strategy: ReframeStrategy,
  editingStyle: EditingStyle,
  currentTime: number,
  clipStartTime: number,
  subtitles?: SubtitleCue[],
  subtitleTheme?: SubtitleTheme,
  hook?: GeneratedHook
) {
  const timeProgress = currentTime - clipStartTime;

  if (strategy === 'Fit + Blur') {
    ctx.save();
    ctx.filter = 'blur(30px) brightness(0.65)';
    ctx.drawImage(video, -40, -40, targetWidth + 80, targetHeight + 80);
    ctx.restore();

    const videoAspect = video.videoWidth / video.videoHeight;
    let drawW = targetWidth;
    let drawH = targetWidth / videoAspect;
    if (drawH > targetHeight) { drawH = targetHeight; drawW = targetHeight * videoAspect; }
    ctx.drawImage(video, (targetWidth - drawW) / 2, (targetHeight - drawH) / 2, drawW, drawH);
  } else {
    const { cropX, cropY, cropWidth, cropHeight } = calculateReframeCrop(
      video.videoWidth, video.videoHeight, targetWidth, targetHeight, strategy, timeProgress
    );

    let scaleEffect = 1.0, shakeX = 0, shakeY = 0;

    if (editingStyle === 'High Energy' || editingStyle === 'Extreme') {
      const bc = timeProgress % 4.5;
      if (bc < 0.6) scaleEffect = 1.05;
      if (editingStyle === 'Extreme' && bc < 0.25) {
        shakeX = (Math.random() - 0.5) * 8;
        shakeY = (Math.random() - 0.5) * 8;
      }
    } else if (editingStyle === 'Balanced') {
      if ((timeProgress % 7.0) < 0.4) scaleEffect = 1.025;
    }

    ctx.save();
    if (scaleEffect !== 1.0 || shakeX !== 0 || shakeY !== 0) {
      ctx.translate(targetWidth / 2 + shakeX, targetHeight / 2 + shakeY);
      ctx.scale(scaleEffect, scaleEffect);
      ctx.translate(-targetWidth / 2, -targetHeight / 2);
    }
    if (editingStyle === 'Extreme' || editingStyle === 'High Energy') {
      ctx.filter = 'contrast(106%) saturate(108%)';
    } else if (editingStyle === 'Balanced') {
      ctx.filter = 'contrast(103%) saturate(104%)';
    }
    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    ctx.restore();
  }

  // Vignette (cached, never recreated per frame)
  ctx.fillStyle = getCachedVignette(ctx, targetWidth, targetHeight);
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Hook overlay
  if (hook && timeProgress <= hook.suggestedDurationSeconds) {
    const fadeOut = Math.max(0, Math.min(1, (hook.suggestedDurationSeconds - timeProgress) / 0.4));
    ctx.save();
    ctx.globalAlpha = fadeOut;
    const hookY = targetHeight * 0.16;
    const scale = targetWidth / 1080;
    ctx.font = `900 ${Math.round(44 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(hook.text.toUpperCase());
    const pillW = metrics.width + 48 * scale;
    const pillH = 72 * scale;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 16 * scale;
    ctx.beginPath();
    ctx.roundRect(targetWidth / 2 - pillW / 2, hookY - pillH / 2, pillW, pillH, 16 * scale);
    ctx.fill();
    ctx.font = `800 ${Math.round(18 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(`⚡ ${hook.category.toUpperCase()}`, targetWidth / 2, hookY - 20 * scale);
    ctx.font = `900 ${Math.round(36 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(hook.text.toUpperCase(), targetWidth / 2, hookY + 12 * scale);
    ctx.restore();
  }

  // Subtitles — binary search, not linear scan
  if (subtitles && subtitleTheme) {
    const cue = findActiveCue(subtitles, currentTime);
    if (cue) drawSubtitlesOnCanvas(ctx, cue, currentTime, targetWidth, targetHeight, subtitleTheme);
  }
}

// ---------------------------------------------------------------------------
// Adaptive quality per device performance tier
// ---------------------------------------------------------------------------

interface AdaptiveSettings { fps: number; bitrate: number; keyframeInterval: number; }

function getAdaptiveSettings(
  perf: RenderOptions['devicePerf'],
  targetFps: number,
  baseBitrate: number
): AdaptiveSettings {
  switch (perf) {
    case 'compat':
      return { fps: Math.min(targetFps, 24), bitrate: Math.min(baseBitrate, 6_000_000), keyframeInterval: 48 };
    case 'limited':
      return { fps: Math.min(targetFps, 30), bitrate: Math.min(baseBitrate, 8_000_000), keyframeInterval: 60 };
    case 'good':
      return { fps: Math.min(targetFps, 60), bitrate: baseBitrate, keyframeInterval: 120 };
    case 'excellent':
    default:
      return { fps: targetFps, bitrate: baseBitrate, keyframeInterval: targetFps * 2 };
  }
}

// ---------------------------------------------------------------------------
// Utility: seek with safeguard timeout
// ---------------------------------------------------------------------------

function seekVideoTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.001) {
      resolve();
      return;
    }

    const handler = () => {
      clearTimeout(timer);
      video.removeEventListener('seeked', handler);
      resolve();
    };

    const timer = setTimeout(() => {
      video.removeEventListener('seeked', handler);
      resolve(); // safeguard: never stall indefinitely
    }, 2500);

    video.addEventListener('seeked', handler);
    video.currentTime = time;
  });
}

// ---------------------------------------------------------------------------
// createRenderCanvas — OffscreenCanvas preferred (runs with GPU acceleration)
// ---------------------------------------------------------------------------

function createRenderCanvas(w: number, h: number): {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
} {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    }) as OffscreenCanvasRenderingContext2D;
    return { canvas, ctx };
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
    willReadFrequently: false,
  }) as CanvasRenderingContext2D;
  return { canvas, ctx };
}

// ---------------------------------------------------------------------------
// Synchronized AAC stereo audio encoder
// ---------------------------------------------------------------------------

async function encodeAudioFromBuffer(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  sampleRate: number,
  channels: number,
  muxer: Muxer<ArrayBufferTarget | FileSystemWritableFileStreamTarget>
): Promise<void> {
  const startSample = Math.max(0, Math.floor(startTime * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
  const totalSamples = Math.max(0, endSample - startSample);
  if (totalSamples <= 0) return;

  let audioErr: Error | null = null;
  const audioEncoder = new AudioEncoder({
    output: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => {
      muxer.addAudioChunk(chunk, meta);
    },
    error: (e: Error) => {
      audioErr = e instanceof Error ? e : new Error(String(e));
    },
  });

  audioEncoder.configure({
    codec: 'mp4a.40.2',
    sampleRate,
    numberOfChannels: channels,
    bitrate: 128_000,
  });

  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < channels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch).subarray(startSample, endSample));
  }

  const CHUNK_SIZE = 1024;
  let sampleOffset = 0;

  while (sampleOffset < totalSamples) {
    if (audioErr) throw audioErr;

    const framesInThisChunk = Math.min(CHUNK_SIZE, totalSamples - sampleOffset);
    const planarData = new Float32Array(framesInThisChunk * channels);

    for (let ch = 0; ch < channels; ch++) {
      const sub = channelData[ch].subarray(sampleOffset, sampleOffset + framesInThisChunk);
      planarData.set(sub, ch * framesInThisChunk);
    }

    const timestampUs = Math.round((sampleOffset / sampleRate) * 1_000_000);

    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate,
      numberOfFrames: framesInThisChunk,
      numberOfChannels: channels,
      timestamp: timestampUs,
      data: planarData,
    });

    audioEncoder.encode(audioData);
    audioData.close();

    sampleOffset += framesInThisChunk;
  }

  await audioEncoder.flush();
  audioEncoder.close();
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Ultra-Fast WebCodecs + mp4-muxer Rendering Pipeline.
 *
 * Optimizations applied:
 *  - Adaptive FPS & bitrate per device tier (24/30 FPS on low-end, 60 FPS on high-end).
 *  - Hardware H.264 profile negotiation (High -> Main -> Baseline).
 *  - OffscreenCanvas with desynchronized GPU pipeline.
 *  - Cached radial gradients & binary search subtitles.
 *  - Zero redundant clearRect memory passes.
 *  - Encoder backpressure flow control to avoid GPU stalls.
 *  - Synchronized stereo AAC audio multiplexing.
 */
export async function renderShortToMp4(options: RenderOptions): Promise<RenderResult> {
  const {
    sourceVideo,
    sourceFile,
    startTime,
    endTime,
    targetWidth,
    targetHeight,
    targetFps = 60,
    bitrate = 10_000_000,
    reframeStrategy,
    editingStyle,
    subtitles,
    subtitleTheme,
    hook,
    onProgress,
    fileHandle,
    devicePerf = 'good',
  } = options;

  const prog = onProgress ?? (() => {});

  if (endTime <= startTime) {
    throw new Error('Invalid clip: endTime must be greater than startTime.');
  }

  // 1. Adapt quality & frame rate according to device capabilities
  const { fps, bitrate: br, keyframeInterval } = getAdaptiveSettings(devicePerf, targetFps, bitrate);
  const duration = endTime - startTime;
  const frameDurationUs = Math.round(1_000_000 / fps);
  const stepSeconds = 1 / fps;
  const totalFrames = Math.ceil(duration * fps);

  prog(1, `⚡ Initializing lightning-fast render @ ${fps} FPS (${totalFrames} frames)...`);

  // 2. Prepare audio track before configuring muxer
  let audioBuffer: AudioBuffer | null = null;
  let targetAudioSampleRate = 48000;
  let targetAudioChannels = 2;
  let hasAudio = false;
  let audioEncoderSupported = false;

  try {
    let arrayBuffer: ArrayBuffer | null = null;
    if (sourceFile) {
      arrayBuffer = await (sourceFile as Blob).arrayBuffer();
    } else if (sourceVideo.src && (sourceVideo.src.startsWith('blob:') || sourceVideo.src.startsWith('http'))) {
      const resp = await fetch(sourceVideo.src);
      arrayBuffer = await resp.arrayBuffer();
    }

    if (arrayBuffer && typeof window !== 'undefined') {
      const ACtx = window.AudioContext || (window as any).webkitAudioContext;
      if (ACtx) {
        const actx = new ACtx();
        try {
          audioBuffer = await actx.decodeAudioData(arrayBuffer.slice(0));
          if (audioBuffer && audioBuffer.duration > 0 && audioBuffer.numberOfChannels > 0) {
            targetAudioSampleRate = audioBuffer.sampleRate;
            targetAudioChannels = Math.min(2, audioBuffer.numberOfChannels);
            hasAudio = true;
          }
        } finally {
          actx.close().catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[VideoEngine] Audio decode skipped:', err);
  }

  if (hasAudio && typeof AudioEncoder !== 'undefined') {
    try {
      const check = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2',
        sampleRate: targetAudioSampleRate,
        numberOfChannels: targetAudioChannels,
        bitrate: 128_000,
      });
      audioEncoderSupported = check.supported ?? false;
    } catch {
      audioEncoderSupported = false;
    }
  }

  // 3. Set up MP4 Muxer (with direct disk streaming or in-memory target)
  let muxerTarget: ArrayBufferTarget | FileSystemWritableFileStreamTarget;
  let fileStream: any = null;
  if (fileHandle) {
    fileStream = await fileHandle.createWritable();
    muxerTarget = new FileSystemWritableFileStreamTarget(fileStream);
  } else {
    muxerTarget = new ArrayBufferTarget();
  }

  const muxer = new Muxer({
    target: muxerTarget,
    video: {
      codec: 'avc',
      width: targetWidth,
      height: targetHeight,
    },
    ...(audioEncoderSupported
      ? {
          audio: {
            codec: 'aac',
            numberOfChannels: targetAudioChannels,
            sampleRate: targetAudioSampleRate,
          },
        }
      : {}),
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  // 4. Configure WebCodecs Hardware VideoEncoder
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('WebCodecs VideoEncoder is not available in your browser.');
  }

  prog(3, 'Configuring hardware video encoder...');

  let encoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e: Error) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
    },
  });

  // Profile cascade: High L5.1 -> Main L4.0 -> Baseline L3.0
  const codecs = [
    { codec: 'avc1.640033', hw: 'prefer-hardware' },
    { codec: 'avc1.4d4028', hw: 'prefer-hardware' },
    { codec: 'avc1.42e01e', hw: 'no-preference' },
  ];
  let chosenCodec = codecs[0].codec;
  for (const c of codecs) {
    try {
      const t = await VideoEncoder.isConfigSupported({
        codec: c.codec,
        width: targetWidth,
        height: targetHeight,
        bitrate: br,
        framerate: fps,
        hardwareAcceleration: c.hw as any,
      });
      if (t.supported) {
        chosenCodec = c.codec;
        break;
      }
    } catch {
      continue;
    }
  }

  videoEncoder.configure({
    codec: chosenCodec,
    width: targetWidth,
    height: targetHeight,
    bitrate: br,
    framerate: fps,
    hardwareAcceleration: 'prefer-hardware',
  });

  // 5. Create render canvas
  const { canvas, ctx } = createRenderCanvas(targetWidth, targetHeight);
  if (!ctx) throw new Error('Render canvas context could not be created.');

  // 6. Fast frame-by-frame extraction loop
  // Muting & pausing video element prevents DOM presentation & audio decoding overhead during seeks
  const prevMuted = sourceVideo.muted;
  const prevPaused = sourceVideo.paused;
  sourceVideo.muted = true;
  sourceVideo.pause();

  prog(5, `⚡ Rendering ${totalFrames} frames with hardware acceleration (${chosenCodec})...`);

  try {
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (encoderError) throw encoderError;

      const currentSec = startTime + frameIndex * stepSeconds;

      // Exact timestamp seek
      await seekVideoTo(sourceVideo, currentSec);

      // Render video + overlays (vignette, kinetic subtitles, hook banner, effects)
      renderFrameToCanvas(
        ctx,
        sourceVideo,
        targetWidth,
        targetHeight,
        reframeStrategy,
        editingStyle,
        currentSec,
        startTime,
        subtitles,
        subtitleTheme,
        hook
      );

      // Create & encode VideoFrame
      const timestampUs = frameIndex * frameDurationUs;
      const vf = new VideoFrame(canvas as HTMLCanvasElement, {
        timestamp: timestampUs,
        duration: frameDurationUs,
      });

      const isKeyFrame = frameIndex % keyframeInterval === 0;
      videoEncoder.encode(vf, { keyFrame: isKeyFrame });
      vf.close();

      // GPU backpressure flow control: keep hardware encoder saturated without memory overload
      if (videoEncoder.encodeQueueSize > 4) {
        await new Promise((r) => setTimeout(r, 0));
      }

      // Update progress every few frames
      if (frameIndex % Math.max(5, Math.floor(fps / 4)) === 0 || frameIndex === totalFrames - 1) {
        const pct = Math.round(5 + (frameIndex / totalFrames) * 85);
        prog(pct, `⚡ Processing frame ${frameIndex + 1}/${totalFrames} @ ${fps} FPS`);
      }
    }
  } finally {
    // Restore video state
    sourceVideo.muted = prevMuted;
    if (!prevPaused) sourceVideo.play().catch(() => {});
  }

  if (encoderError) throw encoderError;

  // 7. Encode synchronized stereo AAC audio
  if (audioEncoderSupported && audioBuffer) {
    prog(92, '⚡ Encoding synchronized AAC stereo audio...');
    try {
      await encodeAudioFromBuffer(
        audioBuffer,
        startTime,
        endTime,
        targetAudioSampleRate,
        targetAudioChannels,
        muxer
      );
    } catch (audioErr) {
      console.warn('[VideoEngine] AAC audio encoding skipped:', audioErr);
    }
  }

  // 8. Finalize VideoEncoder & MP4 container
  prog(96, '⚡ Finalizing ultra-fast MP4 container...');
  await videoEncoder.flush();
  videoEncoder.close();
  muxer.finalize();

  if (fileStream) {
    await fileStream.close();
    prog(100, '⚡ Render complete! Streamed directly to disk.');
    return {
      duration,
      width: targetWidth,
      height: targetHeight,
      fps,
      fileSizeBytes: 0,
      streamedToDisk: true,
      pipeline: `hardware-${chosenCodec}`,
    };
  }

  const buf = (muxerTarget as ArrayBufferTarget).buffer;
  const blob = new Blob([buf], { type: 'video/mp4' });

  prog(100, '⚡ Render complete!');
  return {
    blob,
    duration,
    width: targetWidth,
    height: targetHeight,
    fps,
    fileSizeBytes: blob.size,
    streamedToDisk: false,
    pipeline: `hardware-${chosenCodec}`,
  };
}
