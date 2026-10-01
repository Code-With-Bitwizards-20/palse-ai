export type FilenameFormatMode = 'clean' | 'detailed';

export interface FilenameParameters {
  topicOrHook: string;
  clipIndex: number;
  durationSeconds: number;
  resolutionTier: '1080p' | '2k' | '4k';
  targetFps?: number;
  mode?: FilenameFormatMode;
  extension?: string;
}

/**
 * Sanitize any raw string into a clean, safe, lowercase hyphen-separated slug.
 * Removes unsafe characters, accents, and excessive punctuation.
 */
export function slugify(text: string, maxWords: number = 6): string {
  if (!text) return 'short';

  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join('-')
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-|-$/g, '') || 'short';
}

/**
 * Generate content-grounded filenames according to Section 18 specifications.
 */
export function generateSmartFilename(params: FilenameParameters): string {
  const {
    topicOrHook,
    clipIndex,
    durationSeconds,
    resolutionTier,
    targetFps = 60,
    mode = 'detailed',
    extension = 'mp4',
  } = params;

  const baseSlug = slugify(topicOrHook, mode === 'clean' ? 4 : 6);
  const sequenceStr = `short-${String(clipIndex).padStart(2, '0')}`;
  const durationStr = `${Math.round(durationSeconds)}s`;
  const cleanExt = extension.replace(/^\./, '');

  if (mode === 'clean') {
    // e.g. how-to-improve-react-short-01-30s.mp4
    return `${baseSlug}-${sequenceStr}-${durationStr}.${cleanExt}`;
  }

  // Detailed: how-to-improve-react-performance-short-01-30s-1080p-60fps.mp4
  const resStr = resolutionTier.toLowerCase();
  const fpsStr = `${targetFps}fps`;

  return `${baseSlug}-${sequenceStr}-${durationStr}-${resStr}-${fpsStr}.${cleanExt}`;
}
