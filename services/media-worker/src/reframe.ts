import type { CropKeyframe } from '@shorts/shared';

export interface ReframeParams {
  strategy: string;
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  keyframes?: CropKeyframe[];
  defaultCenterX?: number; // 0 to 100%
}

export interface ReframeFilterResult {
  filterComplex: string;
  isComplexFilter: boolean;
  keyframes: CropKeyframe[];
}

/**
 * Smooth an array of crop keyframes to prevent sudden jumps or camera jitter.
 * Uses an exponential moving average (EMA) filter on horizontal focal centers.
 */
export function smoothKeyframes(
  keyframes: CropKeyframe[],
  alpha: number = 0.25
): CropKeyframe[] {
  if (keyframes.length <= 1) return keyframes;

  const smoothed: CropKeyframe[] = [];
  let currentX = keyframes[0].centerXPercent;
  let currentY = keyframes[0].centerYPercent;

  for (const kf of keyframes) {
    currentX = alpha * kf.centerXPercent + (1 - alpha) * currentX;
    currentY = alpha * kf.centerYPercent + (1 - alpha) * currentY;

    smoothed.push({
      timestamp: kf.timestamp,
      centerXPercent: Math.round(currentX * 10) / 10,
      centerYPercent: Math.round(currentY * 10) / 10,
      scale: kf.scale,
    });
  }

  return smoothed;
}

/**
 * Builds FFmpeg video filter for smart reframing according to strategy.
 */
export function buildReframeFilter(params: ReframeParams): ReframeFilterResult {
  const {
    strategy,
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    keyframes = [],
    defaultCenterX = 50,
  } = params;

  const targetRatio = targetWidth / targetHeight; // e.g. 1080/1920 = 0.5625
  const sourceRatio = sourceWidth / sourceHeight; // e.g. 1920/1080 = 1.777

  // Strategy 1: Blurred Background (fits entire frame with aesthetic frosted glass background)
  if (strategy === 'blurred-background' || strategy === 'fit-entire-frame') {
    const filterComplex = [
      `split=2[bg_src][fg_src]`,
      `[bg_src]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},boxblur=25:5[bg]`,
      `[fg_src]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease[fg]`,
      `[bg][fg]overlay=(W-w)/2:(H-h)/2`,
    ].join(';');

    return {
      filterComplex,
      isComplexFilter: true,
      keyframes: [],
    };
  }

  // If source is already vertical or close to target aspect ratio:
  if (Math.abs(sourceRatio - targetRatio) < 0.05) {
    return {
      filterComplex: `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`,
      isComplexFilter: false,
      keyframes: [],
    };
  }

  // Calculate crop window dimensions on source frame
  let cropW: number;
  let cropH: number;

  if (sourceRatio > targetRatio) {
    // Source is wider than target (e.g. 16:9 to 9:16)
    // Full height is retained, width is cropped to 9/16 of height
    cropH = sourceHeight;
    cropW = Math.round(sourceHeight * targetRatio);
  } else {
    // Source is taller than target
    cropW = sourceWidth;
    cropH = Math.round(sourceWidth / targetRatio);
  }

  // Ensure crop dimensions are even numbers (required by h264/yuv420p)
  cropW = cropW % 2 === 0 ? cropW : cropW - 1;
  cropH = cropH % 2 === 0 ? cropH : cropH - 1;

  const maxOffsetX = Math.max(0, sourceWidth - cropW);
  const maxOffsetY = Math.max(0, sourceHeight - cropH);

  // Strategy 2: AI Smart Crop / Speaker Focus / Manual Crop
  if (keyframes.length > 1) {
    const smoothed = smoothKeyframes(keyframes);
    // Build dynamic expression or evaluate median smoothed anchor
    const avgX = smoothed.reduce((acc, k) => acc + k.centerXPercent, 0) / smoothed.length;
    const clampedCenterFraction = Math.max(0, Math.min(100, avgX)) / 100;
    const targetOffsetX = Math.round(clampedCenterFraction * sourceWidth - cropW / 2);
    const clampedOffsetX = Math.max(0, Math.min(maxOffsetX, targetOffsetX));

    const filter = `crop=${cropW}:${cropH}:${clampedOffsetX}:0,scale=${targetWidth}:${targetHeight}`;
    return {
      filterComplex: filter,
      isComplexFilter: false,
      keyframes: smoothed,
    };
  }

  // Center crop or manual focal position
  const centerFraction = Math.max(0, Math.min(100, defaultCenterX)) / 100;
  const targetOffsetX = Math.round(centerFraction * sourceWidth - cropW / 2);
  const clampedOffsetX = Math.max(0, Math.min(maxOffsetX, targetOffsetX));

  const filter = `crop=${cropW}:${cropH}:${clampedOffsetX}:0,scale=${targetWidth}:${targetHeight}`;

  return {
    filterComplex: filter,
    isComplexFilter: false,
    keyframes: [
      {
        timestamp: 0,
        centerXPercent: defaultCenterX,
        centerYPercent: 50,
        scale: 1.0,
      },
    ],
  };
}
