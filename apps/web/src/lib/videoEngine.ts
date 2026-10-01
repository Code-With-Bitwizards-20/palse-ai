/**
 * Browser-Native Video Processing Engine for Local AI Shorts Studio.
 * Uses WebCodecs, Mediabunny / mp4-muxer, OffscreenCanvas, and 60 FPS rendering pipeline.
 * Runs 100% on the client device. Zero server uploads.
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
  targetWidth: number; // 1080, 1440, 2160
  targetHeight: number; // 1920, 2560, 3840
  targetFps?: number; // 60
  bitrate?: number; // e.g. 10_000_000 for 1080p, 20_000_000 for 2K
  reframeStrategy: ReframeStrategy;
  editingStyle: EditingStyle;
  subtitles?: SubtitleCue[];
  subtitleTheme?: SubtitleTheme;
  hook?: GeneratedHook;
  onProgress?: (progress: number, stageText: string) => void;
  fileHandle?: FileSystemFileHandle; // Optional File System Access handle for direct disk streaming
}

export interface RenderResult {
  blob?: Blob;
  duration: number;
  width: number;
  height: number;
  fps: number;
  fileSizeBytes: number;
  streamedToDisk: boolean;
}

/**
 * Calculates the crop box from a source video frame to fit a vertical 9:16 target canvas.
 */
export function calculateReframeCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  strategy: ReframeStrategy,
  timeProgress: number = 0,
  manualPanOffset: number = 0.5
) {
  const targetAspect = targetWidth / targetHeight; // 9 / 16 = 0.5625
  const sourceAspect = sourceWidth / sourceHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let cropX = 0;
  let cropY = 0;

  if (sourceAspect > targetAspect) {
    // Source is wider (e.g. 16:9 horizontal) -> crop horizontally
    cropWidth = sourceHeight * targetAspect;
    cropHeight = sourceHeight;
    cropY = 0;

    let panX = 0.5; // default center
    switch (strategy) {
      case 'Left':
        panX = 0.2;
        break;
      case 'Right':
        panX = 0.8;
        break;
      case 'Face Focus':
      case 'Speaker Focus':
        // Eased dynamic center with gentle organic breathing
        panX = 0.5 + Math.sin(timeProgress * 0.5) * 0.08;
        break;
      case 'AI Smart':
        // Smooth cinematic pan
        panX = 0.45 + Math.sin(timeProgress * 0.4) * 0.1;
        break;
      case 'Manual':
        panX = manualPanOffset;
        break;
      case 'Center':
      default:
        panX = 0.5;
        break;
    }

    // Clamp cropX so it stays within [0, sourceWidth - cropWidth]
    const maxCropX = sourceWidth - cropWidth;
    cropX = Math.max(0, Math.min(maxCropX, maxCropX * panX));
  } else {
    // Source is taller than 9:16 -> crop vertically
    cropWidth = sourceWidth;
    cropHeight = sourceWidth / targetAspect;
    cropX = 0;
    cropY = (sourceHeight - cropHeight) * 0.5;
  }

  return { cropX, cropY, cropWidth, cropHeight };
}

/**
 * Draw frame with chosen reframe strategy, effects, and color grading.
 */
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
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  if (strategy === 'Fit + Blur') {
    // 1. Draw blurred, stretched background
    ctx.save();
    ctx.filter = 'blur(30px) brightness(0.65)';
    ctx.drawImage(video, -40, -40, targetWidth + 80, targetHeight + 80);
    ctx.restore();

    // 2. Draw pristine sharp video in the center maintaining original aspect ratio
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = targetWidth / targetHeight;
    let drawW = targetWidth;
    let drawH = targetWidth / videoAspect;
    if (drawH > targetHeight) {
      drawH = targetHeight;
      drawW = targetHeight * videoAspect;
    }
    const drawX = (targetWidth - drawW) / 2;
    const drawY = (targetHeight - drawH) / 2;
    ctx.drawImage(video, drawX, drawY, drawW, drawH);
  } else {
    // Smart reframed crop
    const { cropX, cropY, cropWidth, cropHeight } = calculateReframeCrop(
      video.videoWidth,
      video.videoHeight,
      targetWidth,
      targetHeight,
      strategy,
      timeProgress
    );

    // Apply Punch Zooms or Camera Shake according to Editing Style
    let scaleEffect = 1.0;
    let shakeX = 0;
    let shakeY = 0;

    if (editingStyle === 'High Energy' || editingStyle === 'Extreme') {
      // Periodic subtle punch-in on emphasis beats (every 4-5s)
      const beatCycle = timeProgress % 4.5;
      if (beatCycle < 0.6) {
        scaleEffect = 1.05; // 5% punch zoom
      }
      if (editingStyle === 'Extreme' && beatCycle < 0.25) {
        shakeX = (Math.random() - 0.5) * 8;
        shakeY = (Math.random() - 0.5) * 8;
      }
    } else if (editingStyle === 'Balanced') {
      const beatCycle = timeProgress % 7.0;
      if (beatCycle < 0.4) {
        scaleEffect = 1.025; // Gentle 2.5% punch
      }
    }

    ctx.save();
    if (scaleEffect !== 1.0 || shakeX !== 0 || shakeY !== 0) {
      ctx.translate(targetWidth / 2 + shakeX, targetHeight / 2 + shakeY);
      ctx.scale(scaleEffect, scaleEffect);
      ctx.translate(-targetWidth / 2, -targetHeight / 2);
    }

    // Apply color grade filter for cinematic polish
    if (editingStyle === 'Extreme' || editingStyle === 'High Energy') {
      ctx.filter = 'contrast(106%) saturate(108%)';
    } else if (editingStyle === 'Balanced') {
      ctx.filter = 'contrast(103%) saturate(104%)';
    }

    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    ctx.restore();
  }

  // Draw Vignette overlay for cinematic depth
  const vignette = ctx.createRadialGradient(
    targetWidth / 2,
    targetHeight / 2,
    targetWidth * 0.35,
    targetWidth / 2,
    targetHeight / 2,
    targetWidth * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Hook Title Overlay in the opening seconds (first 2.5s - 3.2s)
  if (hook && timeProgress <= hook.suggestedDurationSeconds) {
    const fadeOut = Math.max(0, Math.min(1, (hook.suggestedDurationSeconds - timeProgress) / 0.4));
    ctx.save();
    ctx.globalAlpha = fadeOut;

    const hookY = targetHeight * 0.16; // Top safe-zone (away from face)
    const scale = targetWidth / 1080;

    // Background pill for contrast
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

    // Hook Category Badge
    ctx.font = `800 ${Math.round(18 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(`⚡ ${hook.category.toUpperCase()}`, targetWidth / 2, hookY - 20 * scale);

    // Main Hook Text
    ctx.font = `900 ${Math.round(36 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(hook.text.toUpperCase(), targetWidth / 2, hookY + 12 * scale);

    ctx.restore();
  }

  // Draw Kinetic Subtitle if an active cue exists at this timestamp
  if (subtitles && subtitleTheme) {
    const activeCue = subtitles.find((c) => currentTime >= c.startTime && currentTime <= c.endTime);
    if (activeCue) {
      drawSubtitlesOnCanvas(ctx, activeCue, currentTime, targetWidth, targetHeight, subtitleTheme);
    }
  }
}

/**
 * Main WebCodecs + Mediabunny / mp4-muxer Rendering Pipeline.
 * Decodes source video frames, runs 60 FPS reframe/effect transform,
 * encodes via VideoEncoder, and muxes directly into an MP4 container.
 */
export async function renderShortToMp4(options: RenderOptions): Promise<RenderResult> {
  const {
    sourceVideo,
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
  } = options;

  const duration = endTime - startTime;
  if (duration <= 0) {
    throw new Error('Invalid clip boundaries: endTime must be greater than startTime.');
  }

  const totalFrames = Math.ceil(duration * targetFps);
  const frameDurationUs = Math.round(1_000_000 / targetFps);

  // Set up Canvas for rendering
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(targetWidth, targetHeight)
    : document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  if (!ctx) {
    throw new Error('Failed to create 2D canvas rendering context.');
  }

  // Extract and decode source audio track via Web Audio API
  onProgress?.(3, 'Extracting source audio track');
  let audioBuffer: AudioBuffer | null = null;
  let targetAudioSampleRate = 48000;
  let targetAudioChannels = 2;

  try {
    let arrayBuffer: ArrayBuffer | null = null;
    if (options.sourceFile) {
      arrayBuffer = await options.sourceFile.arrayBuffer();
    } else if (sourceVideo.src && (sourceVideo.src.startsWith('blob:') || sourceVideo.src.startsWith('http') || sourceVideo.src.startsWith('data:'))) {
      const resp = await fetch(sourceVideo.src);
      arrayBuffer = await resp.arrayBuffer();
    }

    if (arrayBuffer && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        try {
          // decodeAudioData detaches the buffer, pass a copy slice
          audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        } finally {
          audioCtx.close().catch(() => {});
        }
      }
    }
  } catch (audioErr) {
    console.warn('[VideoEngine] Could not decode source audio, rendering video without audio:', audioErr);
  }

  // Set up MP4 Muxer with either direct File System stream target or ArrayBuffer memory target
  let muxerTarget;
  let fileStream: any = null;

  if (fileHandle) {
    fileStream = await fileHandle.createWritable();
    muxerTarget = new FileSystemWritableFileStreamTarget(fileStream);
  } else {
    muxerTarget = new ArrayBufferTarget();
  }

  // Check AudioEncoder capability
  let audioEncoder: AudioEncoder | null = null;
  let audioEncoderError: Error | null = null;
  const hasAudio = !!(audioBuffer && audioBuffer.duration > 0 && audioBuffer.numberOfChannels > 0);

  if (hasAudio && typeof AudioEncoder !== 'undefined' && audioBuffer) {
    targetAudioSampleRate = audioBuffer.sampleRate;
    targetAudioChannels = Math.min(2, audioBuffer.numberOfChannels);

    try {
      const check = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2',
        sampleRate: targetAudioSampleRate,
        numberOfChannels: targetAudioChannels,
        bitrate: 128_000,
      });

      if (check.supported) {
        audioEncoder = new AudioEncoder({
          output: (chunk, meta) => {
            muxer.addAudioChunk(chunk, meta);
          },
          error: (err) => {
            console.error('[VideoEngine] AudioEncoder error:', err);
            audioEncoderError = err instanceof Error ? err : new Error(String(err));
          },
        });

        audioEncoder.configure({
          codec: 'mp4a.40.2',
          sampleRate: targetAudioSampleRate,
          numberOfChannels: targetAudioChannels,
          bitrate: 128_000,
        });
      }
    } catch (confErr) {
      console.warn('[VideoEngine] AAC config test failed:', confErr);
    }
  }

  const muxer = new Muxer({
    target: muxerTarget,
    video: {
      codec: 'avc',
      width: targetWidth,
      height: targetHeight,
    },
    ...(audioEncoder
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

  // Check VideoEncoder availability
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('WebCodecs VideoEncoder is not available in your browser.');
  }

  let encodedFrameCount = 0;
  let encoderError: Error | null = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
      encodedFrameCount++;
    },
    error: (e) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
    },
  });

  videoEncoder.configure({
    codec: 'avc1.640033', // H.264 High Profile Level 5.1
    width: targetWidth,
    height: targetHeight,
    bitrate: bitrate,
    framerate: targetFps,
    hardwareAcceleration: 'prefer-hardware',
  });

  onProgress?.(5, 'Preparing hardware video & audio encoders');

  // Render loop across timeline
  const stepSeconds = 1 / targetFps;
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    if (encoderError) throw encoderError;

    const currentSec = startTime + frameIndex * stepSeconds;

    // Seek source video to exact timestamp
    sourceVideo.currentTime = currentSec;
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        sourceVideo.removeEventListener('seeked', onSeeked);
        resolve();
      };
      sourceVideo.addEventListener('seeked', onSeeked);
    });

    // Render frame to canvas with reframe, effects, hook, and kinetic captions
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

    // Create VideoFrame from Canvas
    const timestampUs = frameIndex * frameDurationUs;
    const videoFrame = new VideoFrame(canvas as any, {
      timestamp: timestampUs,
      duration: frameDurationUs,
    });

    // Keyframe every 2 seconds (120 frames at 60 FPS)
    const isKeyFrame = frameIndex % (targetFps * 2) === 0;
    videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });

    // Release VideoFrame memory immediately
    videoFrame.close();

    // Report real progress
    const pct = Math.round(5 + (frameIndex / totalFrames) * 85);
    if (frameIndex % 15 === 0) {
      onProgress?.(pct, `Processing frame ${frameIndex + 1}/${totalFrames} @ 60 FPS`);
    }
  }

  // Encode synchronized AAC Audio Track for the exact clip duration [startTime, endTime]
  if (audioEncoder && audioBuffer) {
    onProgress?.(92, 'Encoding synchronized AAC stereo audio');

    const startSample = Math.max(0, Math.floor(startTime * targetAudioSampleRate));
    const endSample = Math.min(audioBuffer.length, Math.floor(endTime * targetAudioSampleRate));
    const totalAudioSamples = Math.max(0, endSample - startSample);

    if (totalAudioSamples > 0) {
      const channelData: Float32Array[] = [];
      for (let ch = 0; ch < targetAudioChannels; ch++) {
        const srcChannel = audioBuffer.getChannelData(ch);
        channelData.push(srcChannel.subarray(startSample, endSample));
      }

      const CHUNK_SIZE = 1024;
      let sampleOffset = 0;

      while (sampleOffset < totalAudioSamples) {
        if (audioEncoderError) throw audioEncoderError;

        const framesInThisChunk = Math.min(CHUNK_SIZE, totalAudioSamples - sampleOffset);
        const planarData = new Float32Array(framesInThisChunk * targetAudioChannels);

        for (let ch = 0; ch < targetAudioChannels; ch++) {
          const sub = channelData[ch].subarray(sampleOffset, sampleOffset + framesInThisChunk);
          planarData.set(sub, ch * framesInThisChunk);
        }

        const timestampUs = Math.round((sampleOffset / targetAudioSampleRate) * 1_000_000);

        const audioData = new AudioData({
          format: 'f32-planar',
          sampleRate: targetAudioSampleRate,
          numberOfFrames: framesInThisChunk,
          numberOfChannels: targetAudioChannels,
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
  }

  onProgress?.(96, 'Flushing encoders and finalizing MP4 container');
  await videoEncoder.flush();
  videoEncoder.close();

  muxer.finalize();

  if (fileStream) {
    await fileStream.close();
    onProgress?.(100, 'Render complete! Streamed directly to disk.');
    return {
      duration,
      width: targetWidth,
      height: targetHeight,
      fps: targetFps,
      fileSizeBytes: 0,
      streamedToDisk: true,
    };
  }

  const buffer = (muxerTarget as ArrayBufferTarget).buffer;
  const mp4Blob = new Blob([buffer], { type: 'video/mp4' });

  onProgress?.(100, 'Render complete!');
  return {
    blob: mp4Blob,
    duration,
    width: targetWidth,
    height: targetHeight,
    fps: targetFps,
    fileSizeBytes: mp4Blob.size,
    streamedToDisk: false,
  };
}
