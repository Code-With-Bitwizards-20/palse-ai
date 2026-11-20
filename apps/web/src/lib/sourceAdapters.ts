import { checkSsrf } from './ssrfGuard';

export interface SourceValidationResult {
  valid: boolean;
  provider: 'direct' | 'youtube' | 'twitch' | 'vimeo' | 'unsupported';
  allowed: boolean;
  code?: string;
  url: string;
  title?: string;
  videoId?: string;
  author?: string;
  thumbnailUrl?: string;
  contentType?: string;
  sizeBytes?: number | null;
  message?: string;
  guidance?: string;
  directUploadRecommended?: boolean;
}

export interface SourceAdapter {
  name: string;
  canHandle(url: string): boolean;
  validate(url: string): Promise<SourceValidationResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube Source Adapter
// Adheres strictly to platform Terms of Service: no scraping/bot bypassing.
// ─────────────────────────────────────────────────────────────────────────────
export class YouTubeSourceAdapter implements SourceAdapter {
  name = 'youtube';

  private static readonly YT_REGEX =
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

  canHandle(url: string): boolean {
    return YouTubeSourceAdapter.YT_REGEX.test(url);
  }

  async validate(url: string): Promise<SourceValidationResult> {
    const match = url.match(YouTubeSourceAdapter.YT_REGEX);
    const videoId = match ? match[1] : '';

    let title: string | undefined;
    let author: string | undefined;

    // Fetch legitimate public oEmbed metadata
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        title = data.title;
        author = data.author_name;
      }
    } catch {
      // Non-fatal if oEmbed fails
    }

    return {
      valid: true,
      provider: 'youtube',
      allowed: false,
      code: 'YOUTUBE_DIRECT_STREAM_RESTRICTED',
      url,
      videoId,
      title: title ?? (videoId ? `YouTube Video (${videoId})` : 'YouTube Video'),
      author,
      thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined,
      message:
        'Direct stream downloading from YouTube is restricted by platform Terms of Service. PulseCut AI respects platform policies and creator intellectual property.',
      guidance:
        'To process YouTube content you own or have permission to edit, please download the original file via YouTube Studio (studio.youtube.com > Content > Options > Download) and use PulseCut Cloud Direct Upload.',
      directUploadRecommended: true,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Twitch Source Adapter
// ─────────────────────────────────────────────────────────────────────────────
export class TwitchSourceAdapter implements SourceAdapter {
  name = 'twitch';

  private static readonly TWITCH_REGEX =
    /(?:https?:\/\/)?(?:www\.)?(?:twitch\.tv\/videos\/(\d+)|clips\.twitch\.tv\/([a-zA-Z0-9_-]+))/;

  canHandle(url: string): boolean {
    return TwitchSourceAdapter.TWITCH_REGEX.test(url);
  }

  async validate(url: string): Promise<SourceValidationResult> {
    const match = url.match(TwitchSourceAdapter.TWITCH_REGEX);
    const clipId = match ? (match[1] || match[2]) : '';

    return {
      valid: true,
      provider: 'twitch',
      allowed: false,
      code: 'TWITCH_DIRECT_STREAM_RESTRICTED',
      url,
      videoId: clipId,
      title: clipId ? `Twitch Media (${clipId})` : 'Twitch Stream',
      message:
        'Direct stream extraction from Twitch VODs is restricted by Twitch Terms of Service.',
      guidance:
        'Please export your Twitch VOD or clip from the Twitch Video Producer and upload the MP4 file to PulseCut AI.',
      directUploadRecommended: true,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Vimeo Source Adapter
// ─────────────────────────────────────────────────────────────────────────────
export class VimeoSourceAdapter implements SourceAdapter {
  name = 'vimeo';

  private static readonly VIMEO_REGEX =
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;

  canHandle(url: string): boolean {
    return VimeoSourceAdapter.VIMEO_REGEX.test(url);
  }

  async validate(url: string): Promise<SourceValidationResult> {
    const match = url.match(VimeoSourceAdapter.VIMEO_REGEX);
    const videoId = match ? match[1] : '';

    let title: string | undefined;
    let author: string | undefined;

    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        title = data.title;
        author = data.author_name;
      }
    } catch {
      // Non-fatal
    }

    return {
      valid: true,
      provider: 'vimeo',
      allowed: false,
      code: 'VIMEO_DIRECT_STREAM_RESTRICTED',
      url,
      videoId,
      title: title ?? (videoId ? `Vimeo Video (${videoId})` : 'Vimeo Video'),
      author,
      message:
        'Vimeo third-party direct stream downloading requires creator API access or direct file download.',
      guidance:
        'Please download your video file directly from your Vimeo account dashboard and upload it via PulseCut AI Direct Upload.',
      directUploadRecommended: true,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct Media URL Adapter (Direct MP4, WebM, MOV, S3/R2 presigned URLs)
// ─────────────────────────────────────────────────────────────────────────────
export class DirectMediaUrlAdapter implements SourceAdapter {
  name = 'direct';

  private static readonly MAX_BYTES = 500 * 1024 * 1024; // 500 MB

  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async validate(url: string): Promise<SourceValidationResult> {
    // 1. SSRF check
    const ssrf = checkSsrf(url);
    if (!ssrf.allowed) {
      return {
        valid: false,
        provider: 'direct',
        allowed: false,
        code: 'SSRF_BLOCKED',
        url,
        message: ssrf.reason ?? 'URL blocked by security guard (SSRF protection).',
      };
    }

    // 2. HEAD request
    let headRes: Response;
    try {
      headRes = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10_000),
        redirect: 'follow',
      });
    } catch {
      return {
        valid: false,
        provider: 'direct',
        allowed: false,
        code: 'UNREACHABLE_URL',
        url,
        message: 'Could not connect to the remote media URL. Please ensure it is publicly accessible.',
      };
    }

    if (!headRes.ok) {
      return {
        valid: false,
        provider: 'direct',
        allowed: false,
        code: 'HTTP_ERROR',
        url,
        message: `Remote URL returned HTTP ${headRes.status} (${headRes.statusText}).`,
      };
    }

    const contentType = (headRes.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    const isVideo =
      contentType.startsWith('video/') ||
      contentType === 'application/octet-stream' ||
      /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(new URL(url).pathname);

    if (!isVideo) {
      return {
        valid: false,
        provider: 'direct',
        allowed: false,
        code: 'NOT_A_VIDEO',
        url,
        contentType,
        message: `Content-Type "${contentType}" is not a recognized video format.`,
      };
    }

    const contentLengthHeader = headRes.headers.get('content-length');
    const sizeBytes = contentLengthHeader !== null ? parseInt(contentLengthHeader, 10) : null;

    if (sizeBytes !== null && !isNaN(sizeBytes) && sizeBytes > DirectMediaUrlAdapter.MAX_BYTES) {
      return {
        valid: false,
        provider: 'direct',
        allowed: false,
        code: 'FILE_TOO_LARGE',
        url,
        sizeBytes,
        message: `Remote video exceeds the 500 MB size limit (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB).`,
      };
    }

    return {
      valid: true,
      provider: 'direct',
      allowed: true,
      url,
      contentType,
      sizeBytes,
      message: 'Direct media URL is verified and ready for cloud processing.',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry & Resolver
// ─────────────────────────────────────────────────────────────────────────────
const adapters: SourceAdapter[] = [
  new YouTubeSourceAdapter(),
  new TwitchSourceAdapter(),
  new VimeoSourceAdapter(),
  new DirectMediaUrlAdapter(),
];

export async function resolveAndValidateSource(url: string): Promise<SourceValidationResult> {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      provider: 'unsupported',
      allowed: false,
      code: 'INVALID_URL',
      url: url || '',
      message: 'No URL provided.',
    };
  }

  for (const adapter of adapters) {
    if (adapter.canHandle(url)) {
      return adapter.validate(url);
    }
  }

  return {
    valid: false,
    provider: 'unsupported',
    allowed: false,
    code: 'UNSUPPORTED_PROVIDER',
    url,
    message: 'URL does not match any supported video provider or direct media format.',
  };
}
