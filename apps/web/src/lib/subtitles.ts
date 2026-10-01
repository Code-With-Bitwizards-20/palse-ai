/**
 * Kinetic Subtitle System & Formatting Engine.
 * Supports 12 custom styling themes, word-level active highlighting,
 * SRT/VTT parsing & export, and safe-zone clipping.
 */

export type SubtitleThemeId =
  | 'clean-white'
  | 'bold-yellow'
  | 'creator'
  | 'word-highlight'
  | 'karaoke'
  | 'podcast'
  | 'gaming'
  | 'neon'
  | 'cinematic'
  | 'educational'
  | 'minimal'
  | 'high-energy';

export interface SubtitleTheme {
  id: SubtitleThemeId;
  name: string;
  textColor: string;
  highlightColor: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSizePx: number;
  fontWeight: string;
  textTransform: 'none' | 'uppercase' | 'capitalize';
  textShadow: string;
  boxShadow?: string;
  borderRadiusPx: number;
  padding: string;
  animationStyle: 'pop' | 'glow' | 'bounce' | 'slide' | 'fade' | 'none';
}

export const SUBTITLE_THEMES: Record<SubtitleThemeId, SubtitleTheme> = {
  'creator': {
    id: 'creator',
    name: 'Creator Punch',
    textColor: '#FFFFFF',
    highlightColor: '#FACC15', // Bright yellow
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    fontSizePx: 48,
    fontWeight: '900',
    textTransform: 'uppercase',
    textShadow: '0 4px 12px rgba(0,0,0,0.9), 0 0 2px #000000',
    borderRadiusPx: 12,
    padding: '8px 16px',
    animationStyle: 'pop',
  },
  'bold-yellow': {
    id: 'bold-yellow',
    name: 'Bold Yellow',
    textColor: '#FDE047',
    highlightColor: '#FFFFFF',
    fontSizePx: 52,
    fontWeight: '800',
    textTransform: 'uppercase',
    textShadow: '0 4px 14px #000000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
    borderRadiusPx: 8,
    padding: '6px 14px',
    animationStyle: 'bounce',
  },
  'word-highlight': {
    id: 'word-highlight',
    name: 'Active Word Highlight',
    textColor: '#E2E8F0',
    highlightColor: '#38BDF8', // Cyan
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    fontSizePx: 46,
    fontWeight: '800',
    textTransform: 'none',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
    borderRadiusPx: 14,
    padding: '8px 18px',
    animationStyle: 'pop',
  },
  'clean-white': {
    id: 'clean-white',
    name: 'Clean White',
    textColor: '#FFFFFF',
    highlightColor: '#60A5FA',
    fontSizePx: 44,
    fontWeight: '700',
    textTransform: 'none',
    textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 1px 1px 2px #000',
    borderRadiusPx: 8,
    padding: '4px 12px',
    animationStyle: 'fade',
  },
  'karaoke': {
    id: 'karaoke',
    name: 'Karaoke Beat',
    textColor: '#94A3B8',
    highlightColor: '#EC4899', // Pink
    fontSizePx: 50,
    fontWeight: '900',
    textTransform: 'uppercase',
    textShadow: '0 4px 16px rgba(236, 72, 153, 0.6), 2px 2px 0 #000',
    borderRadiusPx: 10,
    padding: '6px 16px',
    animationStyle: 'glow',
  },
  'neon': {
    id: 'neon',
    name: 'Cyber Neon',
    textColor: '#A7F3D0',
    highlightColor: '#10B981',
    backgroundColor: 'rgba(6, 78, 59, 0.85)',
    borderColor: '#34D399',
    fontSizePx: 48,
    fontWeight: '800',
    textTransform: 'uppercase',
    textShadow: '0 0 20px #10B981, 0 0 40px #059669',
    borderRadiusPx: 16,
    padding: '10px 20px',
    animationStyle: 'glow',
  },
  'podcast': {
    id: 'podcast',
    name: 'Podcast Focus',
    textColor: '#F8FAFC',
    highlightColor: '#F59E0B',
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    fontSizePx: 42,
    fontWeight: '700',
    textTransform: 'none',
    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
    borderRadiusPx: 10,
    padding: '8px 16px',
    animationStyle: 'none',
  },
  'gaming': {
    id: 'gaming',
    name: 'Gaming Impact',
    textColor: '#F43F5E',
    highlightColor: '#FBBF24',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderColor: '#F43F5E',
    fontSizePx: 52,
    fontWeight: '900',
    textTransform: 'uppercase',
    textShadow: '0 0 16px rgba(244, 63, 94, 0.8)',
    borderRadiusPx: 6,
    padding: '8px 20px',
    animationStyle: 'bounce',
  },
  'cinematic': {
    id: 'cinematic',
    name: 'Cinematic Sub',
    textColor: '#F1F5F9',
    highlightColor: '#CBD5E1',
    fontSizePx: 40,
    fontWeight: '600',
    textTransform: 'none',
    textShadow: '0 2px 8px rgba(0,0,0,0.95)',
    borderRadiusPx: 4,
    padding: '4px 10px',
    animationStyle: 'none',
  },
  'educational': {
    id: 'educational',
    name: 'Educational Crisp',
    textColor: '#FFFFFF',
    highlightColor: '#38BDF8',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    fontSizePx: 42,
    fontWeight: '700',
    textTransform: 'none',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    borderRadiusPx: 12,
    padding: '8px 16px',
    animationStyle: 'pop',
  },
  'minimal': {
    id: 'minimal',
    name: 'Minimal Clean',
    textColor: '#FFFFFF',
    highlightColor: '#94A3B8',
    fontSizePx: 38,
    fontWeight: '600',
    textTransform: 'none',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
    borderRadiusPx: 6,
    padding: '4px 8px',
    animationStyle: 'none',
  },
  'high-energy': {
    id: 'high-energy',
    name: 'High Energy Red',
    textColor: '#FFFFFF',
    highlightColor: '#EF4444',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    fontSizePx: 54,
    fontWeight: '900',
    textTransform: 'uppercase',
    textShadow: '0 4px 16px rgba(239, 68, 68, 0.8), 2px 2px 0 #000',
    borderRadiusPx: 8,
    padding: '10px 22px',
    animationStyle: 'bounce',
  },
};

export interface SubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  words?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
}

/**
 * Format seconds to SRT timestamp format (HH:MM:SS,mmm)
 */
export function formatSrtTimestamp(seconds: number): string {
  const pad = (n: number, z: number = 2) => ('00' + n).slice(-z);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Format seconds to VTT timestamp format (HH:MM:SS.mmm)
 */
export function formatVttTimestamp(seconds: number): string {
  const pad = (n: number, z: number = 2) => ('00' + n).slice(-z);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(millis, 3)}`;
}

/**
 * Export cues array to standard SRT text format.
 */
export function exportToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue, idx) => {
      return `${idx + 1}\n${formatSrtTimestamp(cue.startTime)} --> ${formatSrtTimestamp(cue.endTime)}\n${cue.text}\n`;
    })
    .join('\n');
}

/**
 * Export cues array to WebVTT text format.
 */
export function exportToVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue) => {
      return `${formatVttTimestamp(cue.startTime)} --> ${formatVttTimestamp(cue.endTime)}\n${cue.text}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

/**
 * Render kinetic subtitles directly onto a 2D Canvas context for 9:16 vertical video export.
 */
export function drawSubtitlesOnCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  cue: SubtitleCue,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number,
  theme: SubtitleTheme,
  safeBottomPercent: number = 22
) {
  if (!cue.text) return;

  ctx.save();

  // Position at target safe zone (typically bottom 20-25% for 9:16 vertical)
  const y = canvasHeight * (1 - safeBottomPercent / 100);
  const centerX = canvasWidth / 2;

  // Scale font size proportionally if canvas is 1080p, 2K, or 4K
  const scale = canvasWidth / 1080;
  const scaledFontSize = Math.round(theme.fontSizePx * scale);

  ctx.font = `${theme.fontWeight} ${scaledFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textToDraw = theme.textTransform === 'uppercase' ? cue.text.toUpperCase() : cue.text;

  // Draw background pill if configured
  if (theme.backgroundColor) {
    const metrics = ctx.measureText(textToDraw);
    const boxWidth = metrics.width + 36 * scale;
    const boxHeight = scaledFontSize * 1.6;
    const boxX = centerX - boxWidth / 2;
    const boxY = y - boxHeight / 2;

    ctx.fillStyle = theme.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, theme.borderRadiusPx * scale);
    ctx.fill();

    if (theme.borderColor) {
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    }
  }

  // Draw drop shadow / text outline
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 12 * scale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4 * scale;

  ctx.fillStyle = theme.textColor;
  ctx.fillText(textToDraw, centerX, y);

  ctx.restore();
}
