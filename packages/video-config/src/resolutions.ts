export type ResolutionTier = '1080p' | '2k' | '4k';
export type AspectRatio = '9:16' | '1:1' | '4:5' | '16:9';

export interface ResolutionProfile {
  tier: ResolutionTier;
  label: string;
  sublabel: string;
  width: number;
  height: number;
  videoBitrateKbps: number;
  maxBitrateKbps: number;
  bufferSizeKbps: number;
  crf: number;
}

export function getResolutionDimensions(
  tier: ResolutionTier,
  aspectRatio: AspectRatio = '9:16'
): { width: number; height: number; bitrateKbps: number } {
  switch (aspectRatio) {
    case '9:16':
      if (tier === '4k') return { width: 2160, height: 3840, bitrateKbps: 35000 };
      if (tier === '2k') return { width: 1440, height: 2560, bitrateKbps: 18000 };
      return { width: 1080, height: 1920, bitrateKbps: 8500 };

    case '1:1':
      if (tier === '4k') return { width: 2160, height: 2160, bitrateKbps: 26000 };
      if (tier === '2k') return { width: 1440, height: 1440, bitrateKbps: 14000 };
      return { width: 1080, height: 1080, bitrateKbps: 6500 };

    case '4:5':
      if (tier === '4k') return { width: 2160, height: 2700, bitrateKbps: 30000 };
      if (tier === '2k') return { width: 1440, height: 1800, bitrateKbps: 16000 };
      return { width: 1080, height: 1350, bitrateKbps: 7500 };

    case '16:9':
      if (tier === '4k') return { width: 3840, height: 2160, bitrateKbps: 35000 };
      if (tier === '2k') return { width: 2560, height: 1440, bitrateKbps: 18000 };
      return { width: 1920, height: 1080, bitrateKbps: 8500 };

    default:
      return { width: 1080, height: 1920, bitrateKbps: 8500 };
  }
}

export const RESOLUTION_PRESETS: Record<ResolutionTier, ResolutionProfile> = {
  '1080p': {
    tier: '1080p',
    label: '1080p Full HD',
    sublabel: 'Universal crisp 1080×1920 @ 60 FPS standard',
    width: 1080,
    height: 1920,
    videoBitrateKbps: 8500,
    maxBitrateKbps: 12000,
    bufferSizeKbps: 17000,
    crf: 18,
  },
  '2k': {
    tier: '2k',
    label: '2K QHD',
    sublabel: 'Crystal sharp 1440×2560 @ 60 FPS master',
    width: 1440,
    height: 2560,
    videoBitrateKbps: 18000,
    maxBitrateKbps: 24000,
    bufferSizeKbps: 36000,
    crf: 17,
  },
  '4k': {
    tier: '4k',
    label: '4K Ultra HD',
    sublabel: 'Pristine 2160×3840 @ 60 FPS archival export',
    width: 2160,
    height: 3840,
    videoBitrateKbps: 35000,
    maxBitrateKbps: 48000,
    bufferSizeKbps: 70000,
    crf: 16,
  },
};
