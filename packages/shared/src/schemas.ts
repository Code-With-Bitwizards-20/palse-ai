import { z } from 'zod';

export const RemainderStrategySchema = z.enum([
  'ignore',
  'shorter-final',
  'redistribute',
  'controlled-overlap',
]);

export const ProcessingModeSchema = z.enum(['mode-a-exact', 'mode-b-highlights']);

export const AspectRatioSchema = z.enum(['9:16', '1:1', '4:5', '16:9', 'original']);

export const ResolutionTierSchema = z.enum(['1080p', '2k', '4k']);

export const EditingIntensitySchema = z.enum(['clean', 'balanced', 'high-energy', 'extreme']);

export const ReframeStrategySchema = z.enum([
  'ai-smart-crop',
  'center-crop',
  'speaker-focus',
  'dual-speaker',
  'gameplay-focus',
  'blurred-background',
  'fit-entire-frame',
  'manual-crop',
]);

export const CalculateClipsInputSchema = z.object({
  sourceDuration: z.number().positive(),
  selectedDuration: z.number().positive(),
  strategy: RemainderStrategySchema.default('ignore'),
});

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200).default('Untitled Project'),
  platforms: z.array(z.string()).min(1).default(['universal']),
  durationSeconds: z.number().int().min(10).max(300).default(30),
  mode: ProcessingModeSchema.default('mode-a-exact'),
  remainderStrategy: RemainderStrategySchema.default('ignore'),
  targetAspectRatio: AspectRatioSchema.default('9:16'),
  qualityTier: ResolutionTierSchema.default('1080p'),
  enable60Fps: z.boolean().default(true),
  subtitleThemeId: z.string().default('bold-creator'),
  editingIntensity: EditingIntensitySchema.default('balanced'),
  reframeStrategy: ReframeStrategySchema.default('ai-smart-crop'),
  enableSmartReframe: z.boolean().default(true),
  enableHooks: z.boolean().default(true),
  enableCaptions: z.boolean().default(true),
  enableAudioEnhancement: z.boolean().default(true),
  enableColorEnhancement: z.boolean().default(true),
  confirmedOwnership: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm ownership or license to process this media.' }),
  }),
});

export const UpdateClipSchema = z.object({
  clipId: z.string().min(1),
  hookText: z.string().max(200).optional(),
  subtitleThemeId: z.string().optional(),
  reframeStrategy: ReframeStrategySchema.optional(),
  cropCenterX: z.number().min(0).max(100).optional(),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  isMuted: z.boolean().optional(),
});
