/**
 * Browser-Native Video Processing Engine for Local AI Shorts Studio.
 * Uses WebCodecs, mediabunny (sequential demux/decode), mp4-muxer,
 * OffscreenCanvas, and hardware-accelerated H.264 encoding.
 * Runs 100% on the client device. Zero server uploads.
 *
 * PERFORMANCE ARCHITECTURE:
 *  PRIMARY PATH (when source is a File/Blob):
 *    mediabunny demux -> sequential VideoSampleSink.samples() -> VideoSample.draw()
 *    -> canvas compositing -> VideoEncoder -> mp4-muxer
 *    ELIMINATES all per-frame random HTMLVideoElement seeks.
 *    Source FPS read from demuxer via computeFrameRateMetrics() (accurate).
 *
 *  FALLBACK PATH (when mediabunny decode unavailable or sourceFile absent):
 *    HTMLVideoElement seeked event (desktop) / RVFC (mobile Chrome).
 *    TRANSACTIONAL: fallback gets its own fresh encoder+muxer — no partial
 *    sequential output is ever mixed with fallback output.
 *
 * KEY FIXES vs previous commit:
 *  A. MEDIABUNNY FORMATS: Use singleton instances (MP4, QTFF, WEBM, MATROSKA)
 *     NOT class constructors. Fixes: "options.formats must be an array of InputFormat"
 *  B. VIDEOSAMPLE: Use sample.draw() — no unsafe 'as unknown as ImageBitmap' cast.
 *  C. LAST SAMPLE LIFETIME: Clone sample before iterator advances/closes it.
 *     Never render a closed VideoSample.
 *  D. TRANSACTIONAL FALLBACK: Sequential attempt owns its own encoder+muxer.
 *     Partial sequential output is discarded; fallback starts completely fresh.
 *  E. FRAME RATE API: computeFrameRateMetrics() not getFrameRateMetrics().
 *  F. ADAPTIVE AUDIO CACHE: Skip full-file PCM cache for sources >10 min
 *     (prevents ~1 GB AudioBuffer for 40-minute source videos).
 *  G. EVENT-DRIVEN BACKPRESSURE: VideoEncoder dequeue event replaces
 *     setTimeout(0) — works correctly in background tabs.
 *  H. DISPOSAL: input.dispose() called once; Symbol.dispose is redundant.
 *
 * Preserved optimizations:
 *  - AudioBuffer cached across all shorts per video source (short files).
 *  - Pre-allocated Float32Array interleave buffer in audio hot-loop.
 *  - VideoEncoder.isConfigSupported() results cached per session.
 *  - Cached vignette radial gradient (never reallocated per frame).
 *  - Subtitle binary search O(log n) per frame.
 *  - OffscreenCanvas with desynchronized=true and alpha=false.
 *  - Dynamic backpressure threshold per device type.
 *  - Progress updates throttled to avoid React reconciliation overhead.
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
// Core frame painter — TWO separate drawing paths:
//  1. HTMLVideoElement / ImageBitmap / VideoFrame fallback path
//  2. Mediabunny VideoSample primary path — uses sample.draw()
// ---------------------------------------------------------------------------

// Shared overlay renderer (vignette + hook + subtitles)
function _applyOverlays(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  targetWidth: number,
  targetHeight: number,
  currentTime: number,
  clipStartTime: number,
  hook?: GeneratedHook,
  subtitles?: SubtitleCue[],
  subtitleTheme?: SubtitleTheme
) {
  const timeProgress = currentTime - clipStartTime;
  ctx.fillStyle = getCachedVignette(ctx, targetWidth, targetHeight);
  ctx.fillRect(0, 0, targetWidth, targetHeight);
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
    ctx.fillText(`\u26a1 ${hook.category.toUpperCase()}`, targetWidth / 2, hookY - 20 * scale);
    ctx.font = `900 ${Math.round(36 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(hook.text.toUpperCase(), targetWidth / 2, hookY + 12 * scale);
    ctx.restore();
  }
  if (subtitles && subtitleTheme) {
    const cue = findActiveCue(subtitles, currentTime);
    if (cue) drawSubtitlesOnCanvas(ctx, cue, currentTime, targetWidth, targetHeight, subtitleTheme);
  }
}

// Shared reframe + effects for CanvasImageSource (HTMLVideoElement / ImageBitmap / VideoFrame)
function _drawCanvasImageSource(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  targetWidth: number,
  targetHeight: number,
  strategy: ReframeStrategy,
  editingStyle: EditingStyle,
  timeProgress: number
) {
  if (strategy === 'Fit + Blur') {
    ctx.save();
    ctx.filter = 'blur(30px) brightness(0.65)';
    ctx.drawImage(source, -40, -40, targetWidth + 80, targetHeight + 80);
    ctx.restore();
    const videoAspect = srcW / srcH;
    let drawW = targetWidth;
    let drawH = targetWidth / videoAspect;
    if (drawH > targetHeight) { drawH = targetHeight; drawW = targetHeight * videoAspect; }
    ctx.drawImage(source, (targetWidth - drawW) / 2, (targetHeight - drawH) / 2, drawW, drawH);
  } else {
    const { cropX, cropY, cropWidth, cropHeight } = calculateReframeCrop(
      srcW, srcH, targetWidth, targetHeight, strategy, timeProgress
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
    ctx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    ctx.restore();
  }
}

// Preview loop / fallback path: accepts HTMLVideoElement, ImageBitmap, or VideoFrame.
export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  video: HTMLVideoElement | ImageBitmap | VideoFrame,
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
  const srcW: number = (video as HTMLVideoElement).videoWidth
    ?? (video as any).displayWidth ?? (video as any).codedWidth ?? (video as any).width ?? 0;
  const srcH: number = (video as HTMLVideoElement).videoHeight
    ?? (video as any).displayHeight ?? (video as any).codedHeight ?? (video as any).height ?? 0;
  _drawCanvasImageSource(ctx, video as CanvasImageSource, srcW, srcH, targetWidth, targetHeight, strategy, editingStyle, timeProgress);
  _applyOverlays(ctx, targetWidth, targetHeight, currentTime, clipStartTime, hook, subtitles, subtitleTheme);
}

/**
 * PRIMARY PATH: Render a Mediabunny VideoSample to the canvas.
 * FIX B: Uses VideoSample.draw() — correctly handles rotation/flip metadata.
 * No unsafe casts. No intermediate copies.
 *
 * VideoSample.draw() signature (from mediabunny 1.61 declarations):
 *   draw(ctx, sx, sy, sWidth, sHeight, dx, dy, dWidth?, dHeight?): void
 */
function renderVideoSampleToCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  sample: {
    displayWidth: number;
    displayHeight: number;
    draw(
      context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
      sx: number, sy: number, sWidth: number, sHeight: number,
      dx: number, dy: number, dWidth?: number, dHeight?: number
    ): void;
  },
  targetWidth: number,
  targetHeight: number,
  strategy: ReframeStrategy,
  editingStyle: EditingStyle,
  currentTime: number,
  clipStartTime: number,
  subtitles?: SubtitleCue[],
  subtitleTheme?: SubtitleTheme,
  hook?: GeneratedHook
): void {
  const timeProgress = currentTime - clipStartTime;
  const srcW = sample.displayWidth;
  const srcH = sample.displayHeight;

  if (strategy === 'Fit + Blur') {
    ctx.save();
    ctx.filter = 'blur(30px) brightness(0.65)';
    sample.draw(ctx, 0, 0, srcW, srcH, -40, -40, targetWidth + 80, targetHeight + 80);
    ctx.restore();
    const videoAspect = srcW / srcH;
    let drawW = targetWidth;
    let drawH = targetWidth / videoAspect;
    if (drawH > targetHeight) { drawH = targetHeight; drawW = targetHeight * videoAspect; }
    sample.draw(ctx, 0, 0, srcW, srcH, (targetWidth - drawW) / 2, (targetHeight - drawH) / 2, drawW, drawH);
  } else {
    const { cropX, cropY, cropWidth, cropHeight } = calculateReframeCrop(
      srcW, srcH, targetWidth, targetHeight, strategy, timeProgress
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
    // FIX B: Use sample.draw() with crop params — handles rotation/flip metadata
    sample.draw(ctx, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    ctx.restore();
  }
  _applyOverlays(ctx, targetWidth, targetHeight, currentTime, clipStartTime, hook, subtitles, subtitleTheme);
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
//
// DESKTOP REGRESSION FIX (commit 68bde2e introduced the regression):
// The previous implementation chained: seeked event -> requestVideoFrameCallback
// This DOUBLED the async round-trips per frame on desktop.
// On desktop Chrome/Edge, the 'seeked' event fires AFTER the frame is decoded
// and drawImage() returns the correct frame immediately — RVFC adds zero value
// there and only adds latency (~4-16ms per frame = 7-29s extra for 1800 frames).
//
// CORRECTED behavior:
//  Desktop / Firefox / Safari: resolve on 'seeked' event ONLY (fastest path).
//  Mobile Chrome (RVFC supported + _isMobile): use RVFC as SOLE signal.
//    On Android, 'seeked' can fire before the pixel data is ready for drawImage(),
//    causing blank frames. RVFC fires after the frame is truly available.
//    We use RVFC INSTEAD OF seeked (not chained after it).
//
// NOTE: When using the PRIMARY sequential mediabunny decode path, seekVideoTo()
// is NOT called during the frame loop at all — only used in the FALLBACK path.
// ---------------------------------------------------------------------------

// Detect once at module level.
const _isMobile = typeof navigator !== 'undefined'
  && /Android|Mobile/i.test(navigator.userAgent);

const _rvfcSupported =
  typeof HTMLVideoElement !== 'undefined' &&
  typeof (HTMLVideoElement.prototype as any).requestVideoFrameCallback === 'function';

function seekVideoTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.001) {
      resolve();
      return;
    }

    // Mobile Chrome: use RVFC as the SOLE signal (replaces seeked event entirely).
    // RVFC fires after the decoded frame is ready for drawImage().
    if (_rvfcSupported && _isMobile) {
      let rVfcHandle: number;
      const timer = setTimeout(() => {
        try { (video as any).cancelVideoFrameCallback(rVfcHandle); } catch { /* noop */ }
        resolve(); // safety timeout
      }, 2000);
      video.currentTime = time;
      rVfcHandle = (video as any).requestVideoFrameCallback(() => {
        clearTimeout(timer);
        resolve();
      });
      return;
    }

    // Desktop and non-RVFC browsers: seeked event ONLY.
    // On desktop Chrome/Edge the 'seeked' event fires after frame decode;
    // drawImage() immediately returns the correct pixel data.
    const handler = () => {
      clearTimeout(timer);
      video.removeEventListener('seeked', handler);
      resolve();
    };
    const timer = setTimeout(() => {
      video.removeEventListener('seeked', handler);
      resolve(); // safeguard: never stall indefinitely
    }, 2000);
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
// AUDIO BUFFER CACHE — keyed by file identity.
//
// FIX F: Adaptive audio caching strategy.
//   For source videos ≤ 10 minutes: decode once, cache the full AudioBuffer,
//   reuse for all shorts (original mobile optimization preserved).
//   For source videos > 10 minutes: skip full-file caching entirely.
//   A 40-minute stereo 48kHz source would require:
//   2411 × 48000 × 2 × 4 bytes ≈ 926 MB of PCM — unacceptable to hold.
//   Instead decode the full buffer once per short and release it after use.
// ---------------------------------------------------------------------------

/** Sources longer than this will not have their full AudioBuffer cached. */
const _AUDIO_CACHE_MAX_DURATION_S = 600; // 10 minutes

interface _AudioCacheEntry {
  key: string;
  audioBuffer: AudioBuffer;
  sampleRate: number;
  channels: number;
  audioEncoderSupported: boolean;
}

let _audioCacheEntry: _AudioCacheEntry | null = null;

function _getAudioCacheKey(sourceFile?: File | Blob, videoSrc?: string): string {
  if (sourceFile && sourceFile instanceof File) {
    return `file:${sourceFile.name}|${sourceFile.size}|${sourceFile.lastModified}`;
  }
  if (sourceFile) return `blob:${sourceFile.size}`;
  if (videoSrc) return `src:${videoSrc}`;
  return 'unknown';
}

/** Clears the audio decode cache. Call when the user loads a new video file. */
export function clearAudioCache(): void {
  _audioCacheEntry = null;
}

// ---------------------------------------------------------------------------
// VideoEncoder.isConfigSupported() result cache.
//
// isConfigSupported() is an async IPC call to the GPU process. On mobile it
// can take 50-200ms per call. The profile cascade makes up to 4 calls per
// short. Caching by (codec|w|h|bitrate|fps|hw) eliminates the repeated
// round-trips for every subsequent short with the same configuration.
//
// ENCODER CONFIG FIX: selectEncoderConfig() now returns a SelectedEncoderConfig
// struct capturing BOTH the validated codec AND the exact hardwareAcceleration
// value. The caller uses this exact struct in VideoEncoder.configure() —
// no more silent override to 'prefer-hardware' regardless of what was tested.
// ---------------------------------------------------------------------------

interface SelectedEncoderConfig {
  codec: string;
  hardwareAcceleration: HardwareAcceleration;
}

const _encoderConfigCache = new Map<string, SelectedEncoderConfig | null>();

async function selectEncoderConfig(
  width: number,
  height: number,
  bitrate: number,
  framerate: number
): Promise<SelectedEncoderConfig> {
  // Profile cascade: High L5.1 -> Main L4.0 -> Baseline L3.0
  // 'prefer-hardware' first — mobile hardware encoders support Main Profile best.
  const candidates: SelectedEncoderConfig[] = [
    { codec: 'avc1.640033', hardwareAcceleration: 'prefer-hardware' },
    { codec: 'avc1.4d4028', hardwareAcceleration: 'prefer-hardware' },
    { codec: 'avc1.42e01e', hardwareAcceleration: 'prefer-hardware' },
    { codec: 'avc1.42e01e', hardwareAcceleration: 'no-preference' },
  ];
  for (const candidate of candidates) {
    const key = `${candidate.codec}|${width}|${height}|${bitrate}|${framerate}|${candidate.hardwareAcceleration}`;
    if (_encoderConfigCache.has(key)) {
      const cached = _encoderConfigCache.get(key);
      if (cached) return cached;
      continue; // null = previously tested and failed
    }
    try {
      const result = await VideoEncoder.isConfigSupported({
        codec: candidate.codec,
        width,
        height,
        bitrate,
        framerate,
        hardwareAcceleration: candidate.hardwareAcceleration,
      });
      const supported = result.supported ?? false;
      _encoderConfigCache.set(key, supported ? candidate : null);
      if (supported) return candidate;
    } catch {
      _encoderConfigCache.set(key, null);
    }
  }
  // Absolute fallback
  return { codec: 'avc1.42e01e', hardwareAcceleration: 'no-preference' };
}

// ---------------------------------------------------------------------------
// FIX G: Event-driven encoder backpressure
//
// Background tabs throttle setTimeout heavily. setTimeout(0) can stall for
// multiple seconds, freezing the frame encode loop. This replaces the
// timer-based drain with an event-driven Promise using VideoEncoder's
// 'dequeue' event (Chrome 108+). Falls back to queueMicrotask() which is
// NOT throttled by background-tab policies.
// ---------------------------------------------------------------------------

function waitForEncoderQueueBelow(encoder: VideoEncoder, threshold: number): Promise<void> {
  if (encoder.encodeQueueSize <= threshold) return Promise.resolve();
  if (typeof encoder.addEventListener === 'function') {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (encoder.encodeQueueSize <= threshold) {
          resolve();
        } else {
          encoder.addEventListener('dequeue', check, { once: true });
        }
      };
      encoder.addEventListener('dequeue', check, { once: true });
    });
  }
  // Fallback: microtask yield — never throttled by background-tab policy
  return new Promise<void>((resolve) => queueMicrotask(resolve));
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
  // MOBILE OPTIMIZATION: Pre-allocate a single interleave buffer at full CHUNK_SIZE
  // capacity and reuse it every iteration — eliminates ~1400 GC allocations for a
  // 30-second stereo 48kHz clip, significantly reducing GC pauses on mobile.
  const planarBuf = new Float32Array(CHUNK_SIZE * channels);
  let sampleOffset = 0;

  while (sampleOffset < totalSamples) {
    if (audioErr) throw audioErr;

    const framesInThisChunk = Math.min(CHUNK_SIZE, totalSamples - sampleOffset);
    // Reuse the pre-allocated buffer; use a subarray view for the final short chunk
    const planarData = framesInThisChunk === CHUNK_SIZE
      ? planarBuf
      : planarBuf.subarray(0, framesInThisChunk * channels);

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
// Sequential frame decode pipeline using mediabunny.
//
// FIX A: Use singleton instances (MP4, QTFF, WEBM, MATROSKA) — NOT classes.
//   "Do not instantiate this class; use the MP4 singleton instead."
//   Using class constructors caused: "options.formats must be an array of InputFormat"
//
// FIX B: Use renderVideoSampleToCanvas() which calls sample.draw() —
//   the correct Mediabunny API. No unsafe 'as unknown as ImageBitmap' cast.
//
// FIX C: Never render a closed VideoSample.
//   Clone the final sample before the iterator loop exits so the clone
//   remains valid for fill-cadence. The clone is owned by us and closed after.
//
// FIX E: computeFrameRateMetrics() — correct method name in 1.61.x.
//
// FIX G: Event-driven backpressure (waitForEncoderQueueBelow) replaces setTimeout.
//
// TRANSACTIONAL: Returns { success, encodedFrames }. The caller (renderShortToMp4)
// passes in its own dedicated encoder+muxer for the sequential attempt.
// If success=false, the caller discards that attempt and creates a fresh
// encoder+muxer for the fallback. Partial sequential output is NEVER mixed
// with fallback output.
// ---------------------------------------------------------------------------

interface SequentialDecodeResult {
  success: boolean;
  encodedFrames: number;
}

async function trySequentialDecode(
  sourceFile: File | Blob,
  startTime: number,
  endTime: number,
  targetWidth: number,
  targetHeight: number,
  fps: number,
  frameDurationUs: number,
  totalFrames: number,
  stepSeconds: number,
  canvas: OffscreenCanvas | HTMLCanvasElement,
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  videoEncoder: VideoEncoder,
  keyframeInterval: number,
  reframeStrategy: ReframeStrategy,
  editingStyle: EditingStyle,
  clipStartTime: number,
  subtitles: SubtitleCue[] | undefined,
  subtitleTheme: SubtitleTheme | undefined,
  hook: GeneratedHook | undefined,
  onProgress: (pct: number, stage: string) => void
): Promise<SequentialDecodeResult> {
  let mb: any;
  try {
    mb = await import('mediabunny');
  } catch {
    return { success: false, encodedFrames: 0 };
  }

  // FIX A: Use SINGLETON instances exported from mediabunny, NOT class constructors.
  // The TypeScript declaration file says:
  //   "Do not instantiate this class; use the MP4 singleton instead."
  // Passing the class (Mp4InputFormat) instead of the instance (MP4) caused:
  //   TypeError: options.formats must be an array of InputFormat
  const { Input, BlobSource, VideoSampleSink } = mb;
  const MP4      = mb.MP4;
  const QTFF     = mb.QTFF;
  const WEBM     = mb.WEBM;
  const MATROSKA = mb.MATROSKA;

  if (!MP4 || !QTFF || !WEBM || !MATROSKA || !Input || !BlobSource || !VideoSampleSink) {
    console.warn('[VideoEngine] Mediabunny API mismatch — required singleton exports not found');
    return { success: false, encodedFrames: 0 };
  }

  const formats = [MP4, QTFF, WEBM, MATROSKA];

  let input: any = null;
  let encodedFrames = 0;

  try {
    input = new Input({ formats, source: new BlobSource(sourceFile) });

    // Use getVideoTracks() — the typed public API for video track access
    let videoTrack: any = null;
    try {
      const vtracks = await input.getVideoTracks();
      videoTrack = vtracks[0] ?? null;
    } catch {
      const allTracks: any[] = await input.getTracks?.() ?? [];
      videoTrack = allTracks.find((t: any) => t.type === 'video' || t.isVideoTrack?.()) ?? null;
    }

    if (!videoTrack) {
      console.warn('[VideoEngine] Sequential: no video track found in source');
      return { success: false, encodedFrames: 0 };
    }

    const canDecode = await videoTrack.canDecode();
    if (!canDecode) {
      console.warn('[VideoEngine] Sequential: video track codec cannot be decoded');
      return { success: false, encodedFrames: 0 };
    }

    // FIX E: computeFrameRateMetrics() is the correct method name in mediabunny 1.61.
    // The old code called getFrameRateMetrics() which does NOT exist.
    let sourceFps = 30;
    try {
      const metrics = await videoTrack.computeFrameRateMetrics({ targetPacketCount: 64 });
      if (metrics?.bestGuessFrameRate > 0) sourceFps = metrics.bestGuessFrameRate;
    } catch { /* non-fatal — fall back to 30 fps assumption */ }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[VideoEngine] pipeline=sequential-mediabunny | sourceFps=${sourceFps} | outputFps=${fps}`);
    }

    const sink = new VideoSampleSink(videoTrack, { hardwareAcceleration: 'no-preference' });
    const ratio = Math.max(1, Math.round(fps / sourceFps));

    let fi = 0;
    let encoderError: Error | null = null;

    // FIX C: Never render a closed VideoSample.
    // We need the last decoded frame to fill remaining output cadence frames
    // (when output fps > source fps, or at clip boundary).
    // Clone it before the iterator advances (which closes the previous sample).
    // The clone is owned by us and MUST be closed after use.
    let lastSampleClone: any = null;

    try {
      for await (const sample of sink.samples(startTime, endTime)) {
        if (encoderError) throw encoderError;
        if (!sample) continue;

        // Release the previous clone now that we have a new fresh sample
        if (lastSampleClone) {
          lastSampleClone.close();
          lastSampleClone = null;
        }

        for (let rep = 0; rep < ratio && fi < totalFrames; rep++) {
          if (encoderError) throw encoderError;
          const sec = clipStartTime + fi * stepSeconds;

          // FIX B: Use renderVideoSampleToCanvas which calls sample.draw()
          renderVideoSampleToCanvas(
            ctx, sample,
            targetWidth, targetHeight,
            reframeStrategy, editingStyle,
            sec, clipStartTime,
            subtitles, subtitleTheme, hook
          );

          const vf = new VideoFrame(canvas as HTMLCanvasElement, {
            timestamp: fi * frameDurationUs,
            duration: frameDurationUs,
          });
          videoEncoder.encode(vf, { keyFrame: fi % keyframeInterval === 0 });
          vf.close();
          encodedFrames++;

          // FIX G: Event-driven backpressure — works in background tabs
          const bpThreshold = _isMobile ? 6 : 12;
          if (videoEncoder.encodeQueueSize > bpThreshold) {
            await waitForEncoderQueueBelow(videoEncoder, bpThreshold);
          }

          if (fi % Math.max(5, Math.floor(fps / 5)) === 0 || fi === totalFrames - 1) {
            const pct = Math.round(5 + (fi / totalFrames) * 85);
            onProgress(pct, `Processing frame ${fi + 1}/${totalFrames} @ ${fps} FPS`);
          }
          fi++;
        }

        // FIX C: Clone BEFORE the iterator advances and closes this sample.
        // The async iterator owns sample lifetime; we must not call close() on it.
        if (fi < totalFrames) {
          lastSampleClone = sample.clone();
        }

        if (fi >= totalFrames) break;
      }
    } finally {
      // If we're done (fi >= totalFrames), lastSampleClone is no longer needed
      if (lastSampleClone && fi >= totalFrames) {
        lastSampleClone.close();
        lastSampleClone = null;
      }
    }

    // Fill remaining output cadence using the last decoded sample clone
    if (lastSampleClone) {
      try {
        while (fi < totalFrames) {
          if (encoderError) throw encoderError;
          const sec = clipStartTime + fi * stepSeconds;
          renderVideoSampleToCanvas(
            ctx, lastSampleClone,
            targetWidth, targetHeight,
            reframeStrategy, editingStyle,
            sec, clipStartTime,
            subtitles, subtitleTheme, hook
          );
          const vf = new VideoFrame(canvas as HTMLCanvasElement, {
            timestamp: fi * frameDurationUs, duration: frameDurationUs,
          });
          videoEncoder.encode(vf, { keyFrame: false });
          vf.close();
          encodedFrames++;
          fi++;
        }
      } finally {
        lastSampleClone.close(); // Always close the clone we own
        lastSampleClone = null;
      }
    }

    if (encoderError) throw encoderError;
    return { success: true, encodedFrames };

  } catch (err) {
    console.warn('[VideoEngine] Sequential decode failed, using seek fallback:', err);
    return { success: false, encodedFrames };
  } finally {
    // FIX H: Use input.dispose() — the correct synchronous disposal API.
    // Never call both Symbol.dispose and dispose(); that calls dispose() twice.
    try { input?.dispose?.(); } catch { /* noop */ }
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * High-Performance WebCodecs + mp4-muxer Rendering Pipeline.
 *
 * PRIMARY: mediabunny sequential demux/decode -> canvas -> VideoEncoder
 *   - Zero random HTMLVideoElement seeks (eliminates dominant bottleneck)
 *   - Source FPS accurately read from demuxer
 *   - 30fps source -> 60fps output: frame duplication (no double seeks)
 *
 * FALLBACK: HTMLVideoElement seeks
 *   - Desktop: seeked event only (DESKTOP REGRESSION FIXED — no extra RVFC)
 *   - Mobile: RVFC only (avoids blank-frame race on Android)
 *
 * All other optimizations preserved:
 *   - AudioBuffer decoded once per source, reused for all shorts
 *   - Pre-allocated audio interleave Float32Array
 *   - Encoder config (codec + hardwareAcceleration) used exactly as validated
 *   - Dynamic backpressure per device type
 *   - Progress updates throttled to avoid React reconciliation overhead
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

  prog(1, `Initializing render @ ${fps} FPS (${totalFrames} frames)...`);

  // 2. Prepare audio track — use cached AudioBuffer if available for this file.
  //    FIX F: Skip full-file PCM cache for long sources (>10 min) to avoid
  //    holding ~1 GB of decoded audio in memory during a 40-short batch.
  let audioBuffer: AudioBuffer | null = null;
  let targetAudioSampleRate = 48000;
  let targetAudioChannels = 2;
  let hasAudio = false;
  let audioEncoderSupported = false;

  try {
    const cacheKey = _getAudioCacheKey(
      sourceFile,
      sourceVideo.src && (sourceVideo.src.startsWith('blob:') || sourceVideo.src.startsWith('http'))
        ? sourceVideo.src
        : undefined
    );

    if (_audioCacheEntry && _audioCacheEntry.key === cacheKey) {
      audioBuffer = _audioCacheEntry.audioBuffer;
      targetAudioSampleRate = _audioCacheEntry.sampleRate;
      targetAudioChannels = _audioCacheEntry.channels;
      audioEncoderSupported = _audioCacheEntry.audioEncoderSupported;
      hasAudio = true;
    } else {
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
            audioBuffer = await actx.decodeAudioData(arrayBuffer);
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

      if (hasAudio && audioBuffer && typeof AudioEncoder !== 'undefined') {
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
        // FIX F: Only cache if source is short enough to be memory-safe.
        // sourceVideo.duration is 0 for first render before metadata loads;
        // in that case we conservatively cache (short source assumption).
        const sourceDuration = sourceVideo.duration > 0 ? sourceVideo.duration : 0;
        const safeToCache = sourceDuration === 0 || sourceDuration <= _AUDIO_CACHE_MAX_DURATION_S;
        if (safeToCache) {
          _audioCacheEntry = {
            key: cacheKey,
            audioBuffer,
            sampleRate: targetAudioSampleRate,
            channels: targetAudioChannels,
            audioEncoderSupported,
          };
        }
        // For long sources: audioBuffer used for this render only; GC'd after function returns.
      }
    }
  } catch (err) {
    console.warn('[VideoEngine] Audio decode skipped:', err);
  }

  // 3. Configure encoder
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('WebCodecs VideoEncoder is not available in your browser.');
  }

  prog(3, 'Configuring hardware video encoder...');

  // ENCODER CONFIG FIX: selectEncoderConfig() returns the EXACT (codec, hardwareAcceleration)
  // pair that was validated. We use it exactly in configure() — no silent override.
  const selectedConfig = await selectEncoderConfig(targetWidth, targetHeight, br, fps);

  // 4. Create render canvas (shared across both pipeline attempts)
  const { canvas, ctx } = createRenderCanvas(targetWidth, targetHeight);
  if (!ctx) throw new Error('Render canvas context could not be created.');

  prog(5, `Rendering ${totalFrames} frames (${selectedConfig.codec})...`);

  // ---------------------------------------------------------------------------
  // 5. PRIMARY: Sequential mediabunny decode attempt
  //
  // FIX D (Transactional architecture):
  // The sequential attempt gets its OWN dedicated encoder + muxer.
  // If it fails after partially encoding frames, those resources are discarded
  // and the fallback starts completely fresh. This prevents corrupted output
  // with duplicate/non-monotonic timestamps.
  // ---------------------------------------------------------------------------
  let usedPipeline = `sequential-${selectedConfig.codec}`;
  let sequentialSuccess = false;

  if (sourceFile) {
    // Sequential attempt: own encoder + muxer (TRANSACTIONAL — never mixed with fallback)
    const seqMuxerTarget = new ArrayBufferTarget();
    const seqMuxer = new Muxer({
      target: seqMuxerTarget,
      video: { codec: 'avc', width: targetWidth, height: targetHeight },
      ...(audioEncoderSupported
        ? { audio: { codec: 'aac', numberOfChannels: targetAudioChannels, sampleRate: targetAudioSampleRate } }
        : {}),
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });

    let seqEncoderError: Error | null = null;
    const seqEncoder = new VideoEncoder({
      output: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => {
        seqMuxer.addVideoChunk(chunk, meta);
      },
      error: (e: Error) => {
        seqEncoderError = e instanceof Error ? e : new Error(String(e));
      },
    });

    seqEncoder.configure({
      codec: selectedConfig.codec,
      width: targetWidth,
      height: targetHeight,
      bitrate: br,
      framerate: fps,
      hardwareAcceleration: selectedConfig.hardwareAcceleration,
    });

    const seqResult = await trySequentialDecode(
      sourceFile, startTime, endTime,
      targetWidth, targetHeight,
      fps, frameDurationUs, totalFrames, stepSeconds,
      canvas, ctx, seqEncoder, keyframeInterval,
      reframeStrategy, editingStyle, startTime,
      subtitles, subtitleTheme, hook, prog
    );

    if (seqResult.success && !seqEncoderError) {
      // Sequential succeeded — finalize this encoder+muxer
      if (audioEncoderSupported && audioBuffer) {
        prog(92, '\u26a1 Encoding synchronized AAC stereo audio...');
        try {
          await encodeAudioFromBuffer(audioBuffer, startTime, endTime,
            targetAudioSampleRate, targetAudioChannels, seqMuxer);
        } catch (audioErr) {
          console.warn('[VideoEngine] AAC audio encoding skipped:', audioErr);
        }
      }
      prog(96, '\u26a1 Finalizing MP4 container...');
      await seqEncoder.flush();
      seqEncoder.close();
      seqMuxer.finalize();

      if (fileHandle) {
        const fileStream = await fileHandle.createWritable();
        try {
          await fileStream.write(seqMuxerTarget.buffer);
        } finally {
          await fileStream.close();
        }
        prog(100, '\u26a1 Render complete! Streamed directly to disk.');
        return { duration, width: targetWidth, height: targetHeight, fps,
          fileSizeBytes: 0, streamedToDisk: true, pipeline: usedPipeline };
      }

      const blob = new Blob([seqMuxerTarget.buffer], { type: 'video/mp4' });
      prog(100, '\u26a1 Render complete!');
      return { blob, duration, width: targetWidth, height: targetHeight, fps,
        fileSizeBytes: blob.size, streamedToDisk: false, pipeline: usedPipeline };
    } else {
      // Sequential failed — discard partial resources, proceed to fresh fallback
      try { seqEncoder.close(); } catch { /* already closed or in error state */ }
      // seqMuxer partial output is simply abandoned (no finalize)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[VideoEngine] Sequential failed after ${seqResult.encodedFrames} frames — starting fresh fallback.`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. FALLBACK: HTMLVideoElement seek-based pipeline
  //    TRANSACTIONAL: completely fresh encoder + muxer — no sequential state carried over.
  //    Desktop: seeked event only (REGRESSION FIX — no extra RVFC round-trip)
  //    Mobile:  RVFC only (avoids blank-frame race on Android)
  // ---------------------------------------------------------------------------
  usedPipeline = `seek-fallback-${selectedConfig.codec}`;

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
    video: { codec: 'avc', width: targetWidth, height: targetHeight },
    ...(audioEncoderSupported
      ? { audio: { codec: 'aac', numberOfChannels: targetAudioChannels, sampleRate: targetAudioSampleRate } }
      : {}),
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  let encoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e: Error) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
    },
  });

  videoEncoder.configure({
    codec: selectedConfig.codec,
    width: targetWidth,
    height: targetHeight,
    bitrate: br,
    framerate: fps,
    hardwareAcceleration: selectedConfig.hardwareAcceleration,
  });

  // Validate fallback source before beginning frame loop
  if (!sourceVideo.src || sourceVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
    videoEncoder.close();
    throw new Error('[VideoEngine] Fallback: sourceVideo has no valid src — cannot render.');
  }

  const prevMuted = sourceVideo.muted;
  const prevPaused = sourceVideo.paused;
  sourceVideo.muted = true;
  sourceVideo.pause();

  try {
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (encoderError) throw encoderError;

      const currentSec = startTime + frameIndex * stepSeconds;
      await seekVideoTo(sourceVideo, currentSec);

      if (sourceVideo.error) {
        throw new Error(`[VideoEngine] Fallback: video error during seek: ${sourceVideo.error.message}`);
      }
      if (sourceVideo.videoWidth === 0 || sourceVideo.videoHeight === 0) {
        throw new Error('[VideoEngine] Fallback: video dimensions are zero — source may be invalid.');
      }

      renderFrameToCanvas(
        ctx, sourceVideo,
        targetWidth, targetHeight,
        reframeStrategy, editingStyle,
        currentSec, startTime,
        subtitles, subtitleTheme, hook
      );

      const vf = new VideoFrame(canvas as HTMLCanvasElement, {
        timestamp: frameIndex * frameDurationUs,
        duration: frameDurationUs,
      });
      videoEncoder.encode(vf, { keyFrame: frameIndex % keyframeInterval === 0 });
      vf.close();

      // FIX G: Event-driven backpressure — works in background tabs
      const bpThreshold = _isMobile ? 4 : 8;
      if (videoEncoder.encodeQueueSize > bpThreshold) {
        await waitForEncoderQueueBelow(videoEncoder, bpThreshold);
      }

      if (frameIndex % Math.max(5, Math.floor(fps / 5)) === 0 || frameIndex === totalFrames - 1) {
        const pct = Math.round(5 + (frameIndex / totalFrames) * 85);
        prog(pct, `Processing frame ${frameIndex + 1}/${totalFrames} @ ${fps} FPS`);
      }
    }
  } finally {
    sourceVideo.muted = prevMuted;
    if (!prevPaused) sourceVideo.play().catch(() => {});
  }

  if (encoderError) throw encoderError;

  // 7. Encode audio for fallback path
  if (audioEncoderSupported && audioBuffer) {
    prog(92, '\u26a1 Encoding synchronized AAC stereo audio...');
    try {
      await encodeAudioFromBuffer(audioBuffer, startTime, endTime,
        targetAudioSampleRate, targetAudioChannels, muxer);
    } catch (audioErr) {
      console.warn('[VideoEngine] AAC audio encoding skipped:', audioErr);
    }
  }

  // 8. Finalize
  prog(96, '\u26a1 Finalizing MP4 container...');
  await videoEncoder.flush();
  videoEncoder.close();
  muxer.finalize();

  if (fileStream) {
    await fileStream.close();
    prog(100, '\u26a1 Render complete! Streamed directly to disk.');
    return { duration, width: targetWidth, height: targetHeight, fps,
      fileSizeBytes: 0, streamedToDisk: true, pipeline: usedPipeline };
  }

  const buf = (muxerTarget as ArrayBufferTarget).buffer;
  const blob = new Blob([buf], { type: 'video/mp4' });
  prog(100, '\u26a1 Render complete!');
  return { blob, duration, width: targetWidth, height: targetHeight, fps,
    fileSizeBytes: blob.size, streamedToDisk: false, pipeline: usedPipeline };
}
