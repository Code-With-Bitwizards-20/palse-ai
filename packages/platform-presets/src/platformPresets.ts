/**
 * Centralized, versioned social platform configurations.
 * Platform limits and safe zones change over time; centralizing ensures
 * rendering and preview logic remain clean and decoupled.
 */

export type PlatformId =
  | 'universal'
  | 'youtube-shorts'
  | 'tiktok'
  | 'instagram-reels'
  | 'facebook-reels'
  | 'x'
  | 'threads';

export interface SafeZoneRect {
  topPercent: number; // percentage from top (0-100)
  bottomPercent: number; // percentage from bottom (0-100)
  leftPercent: number; // percentage from left (0-100)
  rightPercent: number; // percentage from right (0-100)
}

export interface PlatformMetadataConstraints {
  maxTitleLength: number;
  maxDescriptionLength: number;
  recommendedHashtagsMin: number;
  recommendedHashtagsMax: number;
  characterLimitTotal: number;
  supportsHashtagsInTitle: boolean;
}

export interface PlatformPreset {
  id: PlatformId;
  name: string;
  tagline: string;
  recommendedAspectRatio: '9:16' | '1:1' | '4:5' | '16:9';
  acceptableAspectRatios: Array<'9:16' | '1:1' | '4:5' | '16:9'>;
  preferredDimensions: {
    width: number;
    height: number;
  };
  maxDurationSeconds: number;
  minDurationSeconds: number;
  uiSafeZone: SafeZoneRect;
  subtitleSafeZone: SafeZoneRect;
  hookSafeZone: SafeZoneRect;
  recommendedCodec: 'h264' | 'hevc' | 'av1';
  container: 'mp4';
  audioCodec: 'aac';
  audioSampleRate: number;
  audioBitrateKbps: number;
  targetFrameRate: number;
  fastStart: boolean;
  pixelFormat: string;
  metadataConstraints: PlatformMetadataConstraints;
}

export const PLATFORM_PRESETS: Record<PlatformId, PlatformPreset> = {
  universal: {
    id: 'universal',
    name: 'Universal Social Short',
    tagline: 'Standard 9:16 high-compatibility preset optimized for cross-posting everywhere.',
    recommendedAspectRatio: '9:16',
    acceptableAspectRatios: ['9:16', '1:1', '4:5', '16:9'],
    preferredDimensions: { width: 1080, height: 1920 },
    maxDurationSeconds: 180,
    minDurationSeconds: 3,
    uiSafeZone: {
      topPercent: 8,
      bottomPercent: 18,
      leftPercent: 6,
      rightPercent: 16,
    },
    subtitleSafeZone: {
      topPercent: 20,
      bottomPercent: 26,
      leftPercent: 8,
      rightPercent: 18,
    },
    hookSafeZone: {
      topPercent: 10,
      bottomPercent: 75,
      leftPercent: 8,
      rightPercent: 18,
    },
    recommendedCodec: 'h264',
    container: 'mp4',
    audioCodec: 'aac',
    audioSampleRate: 48000,
    audioBitrateKbps: 192,
    targetFrameRate: 60,
    fastStart: true,
    pixelFormat: 'yuv420p',
    metadataConstraints: {
      maxTitleLength: 100,
      maxDescriptionLength: 2200,
      recommendedHashtagsMin: 3,
      recommendedHashtagsMax: 6,
      characterLimitTotal: 2200,
      supportsHashtagsInTitle: true,
    },
  },

  'youtube-shorts': {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    tagline: 'Optimized for the YouTube Shorts feed and algorithm recommendation.',
    recommendedAspectRatio: '9:16',
    acceptableAspectRatios: ['9:16', '1:1'],
    preferredDimensions: { width: 1080, height: 1920 },
    maxDurationSeconds: 180, // Extended up to 3 mins in recent YouTube updates
    minDurationSeconds: 3,
    uiSafeZone: {
      topPercent: 8, // Title & search header
      bottomPercent: 19, // Sound title, remix icon, channel handle
      leftPercent: 5,
      rightPercent: 18, // Like, dislike, comments, share, remix column
    },
    subtitleSafeZone: {
      topPercent: 22,
      bottomPercent: 24,
      leftPercent: 8,
      rightPercent: 20,
    },
    hookSafeZone: {
      topPercent: 12,
      bottomPercent: 70,
      leftPercent: 8,
      rightPercent: 20,
    },
    recommendedCodec: 'h264',
    container: 'mp4',
    audioCodec: 'aac',
    audioSampleRate: 48000,
    audioBitrateKbps: 192,
    targetFrameRate: 60,
    fastStart: true,
    pixelFormat: 'yuv420p',
    metadataConstraints: {
      maxTitleLength: 100,
      maxDescriptionLength: 5000,
      recommendedHashtagsMin: 3,
      recommendedHashtagsMax: 5,
      characterLimitTotal: 5000,
      supportsHashtagsInTitle: true,
    },
  },

  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    tagline: 'High engagement vertical format with maximum right-column and bottom safe margins.',
    recommendedAspectRatio: '9:16',
    acceptableAspectRatios: ['9:16'],
    preferredDimensions: { width: 1080, height: 1920 },
    maxDurationSeconds: 600,
    minDurationSeconds: 3,
    uiSafeZone: {
      topPercent: 10, // Live / Following tabs & search
      bottomPercent: 24, // Author caption, audio ticker, hashtags
      leftPercent: 6,
      rightPercent: 20, // Profile avatar, like, comments, bookmark, share, music disc
    },
    subtitleSafeZone: {
      topPercent: 20,
      bottomPercent: 28,
      leftPercent: 8,
      rightPercent: 22,
    },
    hookSafeZone: {
      topPercent: 12,
      bottomPercent: 68,
      leftPercent: 8,
      rightPercent: 22,
    },
    recommendedCodec: 'h264',
    container: 'mp4',
    audioCodec: 'aac',
    audioSampleRate: 48000,
    audioBitrateKbps: 192,
    targetFrameRate: 60,
    fastStart: true,
    pixelFormat: 'yuv420p',
    metadataConstraints: {
      maxTitleLength: 150,
      maxDescriptionLength: 4000,
      recommendedHashtagsMin: 4,
      recommendedHashtagsMax: 7,
      characterLimitTotal: 4000,
      supportsHashtagsInTitle: false,
    },
  },

  'instagram-reels': {
    id: 'instagram-reels',
    name: 'Instagram Reels',
    tagline: 'Designed for Reels discovery, profile grid compatibility, and engagement buttons.',
    recommendedAspectRatio: '9:16',
    acceptableAspectRatios: ['9:16', '4:5', '1:1'],
    preferredDimensions: { width: 1080, height: 1920 },
    maxDurationSeconds: 90,
    minDurationSeconds: 3,
    uiSafeZone: {
      topPercent: 8, // Header camera & audio icon
      bottomPercent: 22, // Caption overlay, audio title
      leftPercent: 5,
      rightPercent: 18, // Like, comment, share, save, options
    },
    subtitleSafeZone: {
      topPercent: 20,
      bottomPercent: 26,
      leftPercent: 8,
      rightPercent: 20,
    },
    hookSafeZone: {
      topPercent: 12,
      bottomPercent: 70,
      leftPercent: 8,
      rightPercent: 20,
    },
    recommendedCodec: 'h264',
    container: 'mp4',
    audioCodec: 'aac',
    audioSampleRate: 48000,
    audioBitrateKbps: 192,
    targetFrameRate: 60,
    fastStart: true,
    pixelFormat: 'yuv420p',
    metadataConstraints: {
      maxTitleLength: 75,
      maxDescriptionLength: 2200,
      recommendedHashtagsMin: 3,
      recommendedHashtagsMax: 8,
      characterLimitTotal: 2200,
      supportsHashtagsInTitle: false,
    },
  },

  'facebook-reels': {
    id: 'facebook-reels',
    name: 'Facebook Reels',
    tagline: 'Vertical short video configured for Meta social graph distribution.',
    recommendedAspectRatio: '9:16',
    acceptableAspectRatios: ['9:16', '1:1', '4:5'],
    preferredDimensions: { width: 1080, height: 1920 },
    maxDurationSeconds: 90,
    minDurationSeconds: 3,
    uiSafeZone: {
      topPercent: 8,
      bottomPercent: 20,
      leftPercent: 6,
      rightPercent: 18,
    },
    subtitleSafeZone: {
      topPercent: 20,
      bottomPercent: 25,
      leftPercent: 8,
      rightPercent: 20,
    },
    hookSafeZone: {
      topPercent: 12,
      bottomPercent: 72,
      leftPercent: 8,
      rightPercent: 20,
    },
    recommendedCodec: 'h264',
    container: 'mp4',
    audioCodec: 'aac',
    audioSampleRate: 48000,
    audioBitrateKbps: 192,
    targetFrameRate: 60,
    fastStart: true,
    pixelFormat: 'yuv420p',
    metadataConstraints: {
      maxTitleLength: 80,
      maxDescriptionLength: 2200,
      recommendedHashtagsMin: 2,
      recommendedHashtagsMax: 5,
      characterLimitTotal: 2200,
      supportsHashtagsInTitle: false,
    },
  },

  x: {
    id: 'x',
    name: 'X (Twitter)',
    tagline: 'High-clarity video optimized for timeline autoplay and reply engagement.',
    recommendedAspectRatio: '9:16',
    acceptableAspectRatios: ['9:16', '1:1', '16:9'],
    preferredDimensions: { width: 1080, height: 1920 },
    maxDurationSeconds: 140, // Base standard
    minDurationSeconds: 3,
    uiSafeZone: {
      topPercent: 6,
      bottomPercent: 14,
      leftPercent: 6,
      rightPercent: 6,
    },
    subtitleSafeZone: {
      topPercent: 15,
      bottomPercent: 18,
      leftPercent: 8,
      rightPercent: 8,
    },
    hookSafeZone: {
      topPercent: 10,
      bottomPercent: 75,
      leftPercent: 8,
      rightPercent: 8,
    },
    recommendedCodec: 'h264',
    container: 'mp4',
    audioCodec: 'aac',
    audioSampleRate: 48000,
    audioBitrateKbps: 192,
    targetFrameRate: 60,
    fastStart: true,
    pixelFormat: 'yuv420p',
    metadataConstraints: {
      maxTitleLength: 70,
      maxDescriptionLength: 280,
      recommendedHashtagsMin: 1,
      recommendedHashtagsMax: 3,
      characterLimitTotal: 280,
      supportsHashtagsInTitle: false,
    },
  },

  threads: {
    id: 'threads',
    name: 'Threads',
    tagline: 'Clean aesthetic format with subtle UI bounds for conversational engagement.',
    recommendedAspectRatio: '9:16',
    acceptableAspectRatios: ['9:16', '1:1', '4:5'],
    preferredDimensions: { width: 1080, height: 1920 },
    maxDurationSeconds: 300,
    minDurationSeconds: 3,
    uiSafeZone: {
      topPercent: 6,
      bottomPercent: 14,
      leftPercent: 6,
      rightPercent: 6,
    },
    subtitleSafeZone: {
      topPercent: 16,
      bottomPercent: 18,
      leftPercent: 8,
      rightPercent: 8,
    },
    hookSafeZone: {
      topPercent: 10,
      bottomPercent: 75,
      leftPercent: 8,
      rightPercent: 8,
    },
    recommendedCodec: 'h264',
    container: 'mp4',
    audioCodec: 'aac',
    audioSampleRate: 48000,
    audioBitrateKbps: 192,
    targetFrameRate: 60,
    fastStart: true,
    pixelFormat: 'yuv420p',
    metadataConstraints: {
      maxTitleLength: 80,
      maxDescriptionLength: 500,
      recommendedHashtagsMin: 1,
      recommendedHashtagsMax: 3,
      characterLimitTotal: 500,
      supportsHashtagsInTitle: false,
    },
  },
};

export function getPlatformPreset(id: PlatformId): PlatformPreset {
  return PLATFORM_PRESETS[id] || PLATFORM_PRESETS.universal;
}

export function getAllPlatformPresets(): PlatformPreset[] {
  return Object.values(PLATFORM_PRESETS);
}
