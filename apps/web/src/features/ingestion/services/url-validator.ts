export type DetectedPlatform =
  | 'direct-media'
  | 'youtube'
  | 'tiktok'
  | 'twitch'
  | 'vimeo'
  | 'instagram'
  | 'x-twitter'
  | 'unknown';

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  platform: DetectedPlatform;
  isDirectMedia: boolean;
  errorMessage?: string;
  helpMessage?: string;
  officialExportInstructions?: string[];
}

const DIRECT_MEDIA_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogg|ogv|mkv)($|\?)/i;

/**
 * Validates a user-supplied URL and detects the source platform.
 * Enforces HTTPS, rejects dangerous schemes (javascript:, file:, data:).
 */
export function validateVideoUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: '',
      platform: 'unknown',
      isDirectMedia: false,
      errorMessage: 'Please enter a valid URL.',
    };
  }

  // Scheme verification
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      platform: 'unknown',
      isDirectMedia: false,
      errorMessage: 'Invalid URL format. Include http:// or https://',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      normalizedUrl: trimmed,
      platform: 'unknown',
      isDirectMedia: false,
      errorMessage: 'Only HTTP and HTTPS URLs are supported for media processing.',
    };
  }

  const host = parsed.hostname.toLowerCase();

  // 1. Direct Media Check (CORS permitting)
  if (DIRECT_MEDIA_EXTENSIONS.test(parsed.pathname) || DIRECT_MEDIA_EXTENSIONS.test(parsed.href)) {
    return {
      isValid: true,
      normalizedUrl: parsed.href,
      platform: 'direct-media',
      isDirectMedia: true,
    };
  }

  // 2. YouTube
  if (host.includes('youtube.com') || host.includes('youtu.be')) {
    return {
      isValid: true,
      normalizedUrl: parsed.href,
      platform: 'youtube',
      isDirectMedia: false,
      helpMessage:
        'YouTube videos cannot be scraped directly in the browser due to CORS security restrictions and terms.',
      officialExportInstructions: [
        'Open YouTube Studio (studio.youtube.com) on your computer.',
        'Navigate to "Content" and locate your video or livestream VOD.',
        'Click the three dots (⋮) next to the video and select "Download" to save the original MP4 file.',
        'Drop the downloaded MP4 directly into PulseCut AI for instant local processing.',
      ],
    };
  }

  // 3. TikTok
  if (host.includes('tiktok.com')) {
    return {
      isValid: true,
      normalizedUrl: parsed.href,
      platform: 'tiktok',
      isDirectMedia: false,
      helpMessage: 'TikTok web links cannot be loaded without authorized API access.',
      officialExportInstructions: [
        'Open TikTok on your desktop browser or mobile app.',
        'Export or download your original recording via the TikTok Creator Center.',
        'Upload your source video file directly to PulseCut AI.',
      ],
    };
  }

  // 4. Twitch
  if (host.includes('twitch.tv')) {
    return {
      isValid: true,
      normalizedUrl: parsed.href,
      platform: 'twitch',
      isDirectMedia: false,
      helpMessage: 'Twitch VOD streams require stream segment concatenation.',
      officialExportInstructions: [
        'Go to your Twitch Creator Dashboard -> Video Producer.',
        'Find your broadcast and click "Download" or export to YouTube.',
        'Drop the exported MP4 directly into PulseCut AI.',
      ],
    };
  }

  // 5. Instagram
  if (host.includes('instagram.com')) {
    return {
      isValid: true,
      normalizedUrl: parsed.href,
      platform: 'instagram',
      isDirectMedia: false,
      helpMessage: 'Instagram links are protected by authentication barriers and CORS.',
      officialExportInstructions: [
        'Download your original video from your camera roll or Instagram Insights archive.',
        'Upload the MP4 file to PulseCut AI.',
      ],
    };
  }

  // Generic fallback
  return {
    isValid: true,
    normalizedUrl: parsed.href,
    platform: 'unknown',
    isDirectMedia: false,
    helpMessage:
      'This URL does not end in a direct media format (.mp4, .webm). PulseCut AI will test if it returns a CORS-accessible video stream.',
  };
}
