export type SubtitleThemeId =
  | 'clean-minimal'
  | 'bold-creator'
  | 'karaoke-highlight'
  | 'tiktok-style'
  | 'podcast-style'
  | 'gaming-edge'
  | 'neon-glow'
  | 'cinematic-serif'
  | 'educational'
  | 'high-energy'
  | 'custom';

export interface SubtitleTheme {
  id: SubtitleThemeId;
  name: string;
  description: string;
  fontFamily: string;
  fontWeight: number;
  fontSizeAss: number; // For ASS subtitles (standardized on 1080x1920 reference)
  lineSpacing: number;
  primaryColorHex: string; // ASS formatted or hex
  primaryColorAss: string; // &H00BBGGRR
  secondaryColorAss: string; // Karaoke highlight color
  outlineColorAss: string;
  backColorAss: string;
  outlineWidth: number;
  shadowDepth: number;
  alignment: number; // 2 = bottom center, 5 = middle center
  marginV: number;
  marginL: number;
  marginR: number;
  maxWordsPerLine: number;
  maxCharactersPerLine: number;
  wordsPerCaptionGroup: number;
  capitalization: 'uppercase' | 'capitalize' | 'original';
  showEmojis: boolean;
  animationStyle: 'karaoke-pop' | 'typewriter' | 'scale-fade' | 'none';
}

export const SUBTITLE_THEMES: Record<SubtitleThemeId, SubtitleTheme> = {
  'clean-minimal': {
    id: 'clean-minimal',
    name: 'Clean Minimal',
    description: 'Crisp, modern sans-serif with subtle contrast for high legibility.',
    fontFamily: 'Inter, Arial, sans-serif',
    fontWeight: 700,
    fontSizeAss: 54,
    lineSpacing: 10,
    primaryColorHex: '#FFFFFF',
    primaryColorAss: '&H00FFFFFF', // White
    secondaryColorAss: '&H0000D4FF', // Subtle warm yellow
    outlineColorAss: '&H00101010', // Deep dark
    backColorAss: '&H80000000',
    outlineWidth: 3,
    shadowDepth: 1,
    alignment: 2, // Bottom center
    marginV: 380, // Safe from TikTok/Reels bottom overlays
    marginL: 120,
    marginR: 120,
    maxWordsPerLine: 4,
    maxCharactersPerLine: 28,
    wordsPerCaptionGroup: 3,
    capitalization: 'original',
    showEmojis: true,
    animationStyle: 'scale-fade',
  },

  'bold-creator': {
    id: 'bold-creator',
    name: 'Bold Creator',
    description: 'Heavy display font with strong dark stroke, favored by top creators.',
    fontFamily: 'Impact, Arial Black, sans-serif',
    fontWeight: 900,
    fontSizeAss: 66,
    lineSpacing: 8,
    primaryColorHex: '#FFF500',
    primaryColorAss: '&H0000F5FF', // Bright yellow
    secondaryColorAss: '&H00FFFFFF', // White pop
    outlineColorAss: '&H00000000', // Solid black outline
    backColorAss: '&H00000000',
    outlineWidth: 5,
    shadowDepth: 3,
    alignment: 2,
    marginV: 420,
    marginL: 100,
    marginR: 100,
    maxWordsPerLine: 3,
    maxCharactersPerLine: 22,
    wordsPerCaptionGroup: 2,
    capitalization: 'uppercase',
    showEmojis: true,
    animationStyle: 'karaoke-pop',
  },

  'karaoke-highlight': {
    id: 'karaoke-highlight',
    name: 'Karaoke Word Highlight',
    description: 'Highlights the currently spoken word live in sync with speech.',
    fontFamily: 'Montserrat, Arial, sans-serif',
    fontWeight: 800,
    fontSizeAss: 62,
    lineSpacing: 8,
    primaryColorHex: '#FFFFFF',
    primaryColorAss: '&H00FFFFFF', // Inactive words: White
    secondaryColorAss: '&H0033E600', // Active word: Electric Green
    outlineColorAss: '&H001A1A1A',
    backColorAss: '&H00000000',
    outlineWidth: 4,
    shadowDepth: 2,
    alignment: 2,
    marginV: 400,
    marginL: 90,
    marginR: 90,
    maxWordsPerLine: 4,
    maxCharactersPerLine: 26,
    wordsPerCaptionGroup: 3,
    capitalization: 'uppercase',
    showEmojis: true,
    animationStyle: 'karaoke-pop',
  },

  'tiktok-style': {
    id: 'tiktok-style',
    name: 'TikTok Native',
    tagline: 'Clean black-pill background matching native in-app aesthetics.',
    description: 'Familiar rounded pill background with ultra-clear white typography.',
    fontFamily: 'Proxima Nova, Arial, sans-serif',
    fontWeight: 700,
    fontSizeAss: 52,
    lineSpacing: 10,
    primaryColorHex: '#FFFFFF',
    primaryColorAss: '&H00FFFFFF',
    secondaryColorAss: '&H0000EAFF', // TikTok Cyan
    outlineColorAss: '&H00000000',
    backColorAss: '&HCC000000', // Semi-opaque dark badge
    outlineWidth: 0,
    shadowDepth: 0,
    alignment: 2,
    marginV: 440,
    marginL: 110,
    marginR: 110,
    maxWordsPerLine: 4,
    maxCharactersPerLine: 24,
    wordsPerCaptionGroup: 4,
    capitalization: 'original',
    showEmojis: true,
    animationStyle: 'scale-fade',
  } as SubtitleTheme,

  'podcast-style': {
    id: 'podcast-style',
    name: 'Podcast Dialogue',
    description: 'Subtle lower-third layout with speaker differentiation.',
    fontFamily: 'Inter, Helvetica, sans-serif',
    fontWeight: 600,
    fontSizeAss: 48,
    lineSpacing: 12,
    primaryColorHex: '#F0F0F0',
    primaryColorAss: '&H00F0F0F0',
    secondaryColorAss: '&H0022B8CF',
    outlineColorAss: '&H000A0A0A',
    backColorAss: '&HA00F0F0F',
    outlineWidth: 2,
    shadowDepth: 1,
    alignment: 2,
    marginV: 360,
    marginL: 130,
    marginR: 130,
    maxWordsPerLine: 5,
    maxCharactersPerLine: 32,
    wordsPerCaptionGroup: 5,
    capitalization: 'original',
    showEmojis: false,
    animationStyle: 'none',
  },

  'gaming-edge': {
    id: 'gaming-edge',
    name: 'Gaming Edge',
    description: 'Futuristic geometric font with sharp edges and electric cyan glow.',
    fontFamily: 'Rajdhani, Arial Black, sans-serif',
    fontWeight: 800,
    fontSizeAss: 64,
    lineSpacing: 6,
    primaryColorHex: '#00FFFF',
    primaryColorAss: '&H00FFFF00', // Cyan
    secondaryColorAss: '&H000055FF', // Orange
    outlineColorAss: '&H00200000', // Deep navy
    backColorAss: '&H00000000',
    outlineWidth: 4,
    shadowDepth: 3,
    alignment: 2,
    marginV: 420,
    marginL: 100,
    marginR: 100,
    maxWordsPerLine: 3,
    maxCharactersPerLine: 20,
    wordsPerCaptionGroup: 2,
    capitalization: 'uppercase',
    showEmojis: true,
    animationStyle: 'karaoke-pop',
  },

  'neon-glow': {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Luminescent cyberpunk style with soft atmospheric outer glow.',
    fontFamily: 'Outfit, Arial, sans-serif',
    fontWeight: 800,
    fontSizeAss: 60,
    lineSpacing: 8,
    primaryColorHex: '#FF1493',
    primaryColorAss: '&H00D414FF', // Neon magenta
    secondaryColorAss: '&H00FFFF00', // Neon cyan
    outlineColorAss: '&H004A004A',
    backColorAss: '&H00000000',
    outlineWidth: 4,
    shadowDepth: 4,
    alignment: 2,
    marginV: 400,
    marginL: 100,
    marginR: 100,
    maxWordsPerLine: 4,
    maxCharactersPerLine: 24,
    wordsPerCaptionGroup: 3,
    capitalization: 'uppercase',
    showEmojis: true,
    animationStyle: 'scale-fade',
  },

  'cinematic-serif': {
    id: 'cinematic-serif',
    name: 'Cinematic Editorial',
    description: 'Sophisticated editorial serif for documentaries and premium narratives.',
    fontFamily: 'Playfair Display, Georgia, serif',
    fontWeight: 700,
    fontSizeAss: 50,
    lineSpacing: 10,
    primaryColorHex: '#FFF8E7',
    primaryColorAss: '&H00E7F8FF', // Soft warm cream
    secondaryColorAss: '&H0080B0D0', // Vintage gold
    outlineColorAss: '&H00141414',
    backColorAss: '&H00000000',
    outlineWidth: 2,
    shadowDepth: 2,
    alignment: 2,
    marginV: 370,
    marginL: 120,
    marginR: 120,
    maxWordsPerLine: 5,
    maxCharactersPerLine: 30,
    wordsPerCaptionGroup: 4,
    capitalization: 'original',
    showEmojis: false,
    animationStyle: 'none',
  },

  educational: {
    id: 'educational',
    name: 'Educational Clarity',
    description: 'Clear rounded font with soft highlight boxes for tutorials and explanations.',
    fontFamily: 'Rubik, Arial, sans-serif',
    fontWeight: 700,
    fontSizeAss: 54,
    lineSpacing: 8,
    primaryColorHex: '#FFFFFF',
    primaryColorAss: '&H00FFFFFF',
    secondaryColorAss: '&H0020A4F3',
    outlineColorAss: '&H001A1A1A',
    backColorAss: '&HA0101010',
    outlineWidth: 3,
    shadowDepth: 1,
    alignment: 2,
    marginV: 390,
    marginL: 100,
    marginR: 100,
    maxWordsPerLine: 4,
    maxCharactersPerLine: 26,
    wordsPerCaptionGroup: 4,
    capitalization: 'original',
    showEmojis: true,
    animationStyle: 'scale-fade',
  },

  'high-energy': {
    id: 'high-energy',
    name: 'High-Energy Display',
    description: 'Punchy angled display typography designed for fast retention retention hooks.',
    fontFamily: 'Arial Black, Impact, sans-serif',
    fontWeight: 900,
    fontSizeAss: 70,
    lineSpacing: 6,
    primaryColorHex: '#00FF66',
    primaryColorAss: '&H0066FF00', // Vibrant green
    secondaryColorAss: '&H0000FFFF', // Vivid yellow
    outlineColorAss: '&H00000000', // Thick black outline
    backColorAss: '&H00000000',
    outlineWidth: 6,
    shadowDepth: 4,
    alignment: 2,
    marginV: 430,
    marginL: 90,
    marginR: 90,
    maxWordsPerLine: 2,
    maxCharactersPerLine: 16,
    wordsPerCaptionGroup: 2,
    capitalization: 'uppercase',
    showEmojis: true,
    animationStyle: 'karaoke-pop',
  },

  custom: {
    id: 'custom',
    name: 'Custom User Theme',
    description: 'Fully personalized fonts, colors, margins, and animation timing.',
    fontFamily: 'Inter, Arial, sans-serif',
    fontWeight: 700,
    fontSizeAss: 56,
    lineSpacing: 8,
    primaryColorHex: '#FFFFFF',
    primaryColorAss: '&H00FFFFFF',
    secondaryColorAss: '&H0000FFFF',
    outlineColorAss: '&H00000000',
    backColorAss: '&H00000000',
    outlineWidth: 4,
    shadowDepth: 2,
    alignment: 2,
    marginV: 400,
    marginL: 100,
    marginR: 100,
    maxWordsPerLine: 4,
    maxCharactersPerLine: 24,
    wordsPerCaptionGroup: 3,
    capitalization: 'uppercase',
    showEmojis: true,
    animationStyle: 'karaoke-pop',
  },
};

export function getSubtitleTheme(id: SubtitleThemeId): SubtitleTheme {
  return SUBTITLE_THEMES[id] || SUBTITLE_THEMES['bold-creator'];
}
