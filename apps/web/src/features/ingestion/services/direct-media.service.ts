import { DirectMediaProgress, MediaMetadata } from '../types/source.types';

export interface CorsCheckResult {
  accessible: boolean;
  corsEnabled: boolean;
  contentLength?: number;
  mimeType?: string;
  acceptRanges?: boolean;
  error?: string;
}

/**
 * Probes a direct media URL from the client browser to test for CORS compliance,
 * Content-Type, and size without downloading the entire file.
 */
export async function probeDirectMediaCors(url: string, signal?: AbortSignal): Promise<CorsCheckResult> {
  try {
    // Attempt a lightweight HEAD request first
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      signal,
    });

    if (!response.ok) {
      return {
        accessible: false,
        corsEnabled: true,
        error: `Server responded with HTTP status ${response.status} (${response.statusText}).`,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges') === 'bytes';

    return {
      accessible: true,
      corsEnabled: true,
      contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
      mimeType: contentType,
      acceptRanges,
    };
  } catch (err: any) {
    // A TypeError in fetch typically indicates a CORS block or network failure
    const isCors = err.name === 'TypeError' || err.message?.includes('Failed to fetch');
    return {
      accessible: false,
      corsEnabled: false,
      error: isCors
        ? 'Cross-Origin Resource Sharing (CORS) blocked: The hosting server does not allow browsers to read this media file. Download the file locally and upload it directly.'
        : (err.message || 'Network error accessing video URL.'),
    };
  }
}

/**
 * Downloads a direct media URL progressively in the browser, tracking byte progress,
 * and converts it into a standard File object for cloud ingestion.
 */
export async function downloadDirectMedia(
  url: string,
  onProgress?: (progress: DirectMediaProgress) => void,
  signal?: AbortSignal
): Promise<File> {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to download media: HTTP ${response.status} ${response.statusText}`);
  }

  const totalLength = parseInt(response.headers.get('content-length') || '0', 10);
  const contentType = response.headers.get('content-type') || 'video/mp4';

  // Read response stream to report live download percentage
  if (response.body && totalLength > 0) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;

      if (onProgress) {
        onProgress({
          bytesLoaded: receivedBytes,
          totalBytes: totalLength,
          percent: Math.min(100, Math.round((receivedBytes / totalLength) * 100)),
        });
      }
    }

    const blob = new Blob(chunks as BlobPart[], { type: contentType });
    const filename = extractFilenameFromUrl(url);
    return new File([blob], filename, { type: contentType });
  }

  // Fallback if ReadableStream is not available
  const blob = await response.blob();
  const filename = extractFilenameFromUrl(url);
  return new File([blob], filename, { type: contentType || blob.type });
}

function extractFilenameFromUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const pathname = parsed.pathname;
    const lastPart = pathname.substring(pathname.lastIndexOf('/') + 1);
    if (lastPart && lastPart.includes('.')) {
      return decodeURIComponent(lastPart);
    }
  } catch {
    // fallback
  }
  return `imported_video_${Date.now()}.mp4`;
}
