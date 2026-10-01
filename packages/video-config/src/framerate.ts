export interface FrameRateStrategy {
  targetFps: 60;
  mode: 'native' | 'motion-compensated' | 'blend' | 'duplicate';
  filterString: string;
  explanation: string;
}

export function determineFrameRateStrategy(
  sourceFps: number,
  preferMotionCompensated: boolean = true
): FrameRateStrategy {
  if (sourceFps >= 59.94) {
    return {
      targetFps: 60,
      mode: 'native',
      filterString: 'fps=fps=60:round=near',
      explanation: 'Preserves native high-frame-rate motion and conforms to exactly 60 FPS CFR.',
    };
  }

  if (preferMotionCompensated) {
    // Motion-compensated interpolation with scene change detection to prevent ghosting across cuts
    return {
      targetFps: 60,
      mode: 'motion-compensated',
      // minterpolate with advanced bidirectional motion estimation and scene change detection
      filterString: 'minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fd',
      explanation:
        'Smooth 60 FPS motion-compensated interpolation with automatic cut protection.',
    };
  }

  return {
    targetFps: 60,
    mode: 'duplicate',
    filterString: 'fps=fps=60:round=near',
    explanation: 'Clean CFR 60 FPS conform without synthetic motion interpolation artifacts.',
  };
}
