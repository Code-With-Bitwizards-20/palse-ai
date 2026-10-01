export type ContentStyle =
  | 'talking-head'
  | 'podcast'
  | 'interview'
  | 'tutorial'
  | 'educational'
  | 'gaming'
  | 'montage'
  | 'amv-edit'
  | 'vlog'
  | 'storytime'
  | 'product-demo'
  | 'motivational'
  | 'comedy'
  | 'cinematic'
  | 'other';

export type EditingIntensity = 'clean' | 'balanced' | 'high-energy' | 'extreme';

export interface EditingProfile {
  intensity: EditingIntensity;
  name: string;
  description: string;
  zoomFrequencySeconds: number; // e.g., 0 = disabled, 4 = zoom punch every ~4s
  zoomScale: number; // 1.15 = 15% punch-in
  enableDeadAirTrimming: boolean;
  minSilenceDurationSeconds: number;
  enableAudioDucking: boolean;
  enableDynamicColorPreservation: boolean;
  enableMotionBlur: boolean;
  speedRampMultiplier: number;
}

export const EDITING_PROFILES: Record<EditingIntensity, EditingProfile> = {
  clean: {
    intensity: 'clean',
    name: 'Clean & Natural',
    description: 'Minimal cuts, seamless flow, professional podcast or interview dialogue.',
    zoomFrequencySeconds: 0, // No artificial zooms
    zoomScale: 1.0,
    enableDeadAirTrimming: false,
    minSilenceDurationSeconds: 1.5,
    enableAudioDucking: true,
    enableDynamicColorPreservation: true,
    enableMotionBlur: false,
    speedRampMultiplier: 1.0,
  },

  balanced: {
    intensity: 'balanced',
    name: 'Balanced Retention',
    description: 'Subtle punch zooms on key emphasis moments, gentle audio sweetening.',
    zoomFrequencySeconds: 6,
    zoomScale: 1.1,
    enableDeadAirTrimming: true,
    minSilenceDurationSeconds: 0.8,
    enableAudioDucking: true,
    enableDynamicColorPreservation: true,
    enableMotionBlur: false,
    speedRampMultiplier: 1.0,
  },

  'high-energy': {
    intensity: 'high-energy',
    name: 'High Energy Creator',
    description: 'Fast pacing, periodic punch-ins, smart pauses removed, bold visuals.',
    zoomFrequencySeconds: 3.5,
    zoomScale: 1.18,
    enableDeadAirTrimming: true,
    minSilenceDurationSeconds: 0.5,
    enableAudioDucking: true,
    enableDynamicColorPreservation: true,
    enableMotionBlur: true,
    speedRampMultiplier: 1.05,
  },

  extreme: {
    intensity: 'extreme',
    name: 'Extreme Edit',
    description: 'Aggressive pacing, dynamic camera motions, glitch accents, rapid emphasis.',
    zoomFrequencySeconds: 2.2,
    zoomScale: 1.25,
    enableDeadAirTrimming: true,
    minSilenceDurationSeconds: 0.35,
    enableAudioDucking: true,
    enableDynamicColorPreservation: true,
    enableMotionBlur: true,
    speedRampMultiplier: 1.1,
  },
};
