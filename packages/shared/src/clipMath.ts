export type RemainderStrategy =
  | 'ignore' // 1. Ignore remainder
  | 'shorter-final' // 2. Generate one shorter final clip
  | 'redistribute' // 3. Smartly redistribute boundaries
  | 'controlled-overlap'; // 4. Create an additional target-length clip using controlled overlap

export interface ClipBoundary {
  index: number; // 1-based index
  startTime: number; // in seconds
  endTime: number; // in seconds
  duration: number; // in seconds
  isRemainder: boolean;
  isOverlapping: boolean;
}

export interface ClipCalculationResult {
  sourceDuration: number;
  selectedDuration: number;
  fullClipCount: number;
  remainder: number;
  estimatedOutputs: number;
  strategy: RemainderStrategy;
  clips: ClipBoundary[];
}

/**
 * Accurately calculate clip count and boundaries according to project specifications.
 * Ensures strict mathematical correctness:
 * fullClipCount = floor(sourceDuration / selectedDuration)
 * remainder = sourceDuration % selectedDuration
 */
export function calculateClips(
  sourceDuration: number,
  selectedDuration: number,
  strategy: RemainderStrategy = 'ignore'
): ClipCalculationResult {
  if (sourceDuration <= 0) {
    throw new Error('Source duration must be greater than 0');
  }
  if (selectedDuration <= 0) {
    throw new Error('Selected duration must be greater than 0');
  }

  // Standard calculation
  const fullClipCount = Math.floor(sourceDuration / selectedDuration);
  // Round to 3 decimal places to avoid floating point math anomalies
  const remainder = Math.round((sourceDuration % selectedDuration) * 1000) / 1000;

  const clips: ClipBoundary[] = [];

  if (fullClipCount === 0) {
    // Source is shorter than selected target duration
    clips.push({
      index: 1,
      startTime: 0,
      endTime: sourceDuration,
      duration: sourceDuration,
      isRemainder: true,
      isOverlapping: false,
    });
    return {
      sourceDuration,
      selectedDuration,
      fullClipCount: 0,
      remainder,
      estimatedOutputs: 1,
      strategy,
      clips,
    };
  }

  if (remainder === 0 || strategy === 'ignore') {
    // Exactly full clips only
    for (let i = 0; i < fullClipCount; i++) {
      const start = Math.round(i * selectedDuration * 1000) / 1000;
      const end = Math.round((i + 1) * selectedDuration * 1000) / 1000;
      clips.push({
        index: i + 1,
        startTime: start,
        endTime: end,
        duration: Math.round((end - start) * 1000) / 1000,
        isRemainder: false,
        isOverlapping: false,
      });
    }
  } else if (strategy === 'shorter-final') {
    // Full clips + 1 shorter final clip
    for (let i = 0; i < fullClipCount; i++) {
      const start = Math.round(i * selectedDuration * 1000) / 1000;
      const end = Math.round((i + 1) * selectedDuration * 1000) / 1000;
      clips.push({
        index: i + 1,
        startTime: start,
        endTime: end,
        duration: Math.round((end - start) * 1000) / 1000,
        isRemainder: false,
        isOverlapping: false,
      });
    }
    const remStart = Math.round(fullClipCount * selectedDuration * 1000) / 1000;
    clips.push({
      index: fullClipCount + 1,
      startTime: remStart,
      endTime: sourceDuration,
      duration: remainder,
      isRemainder: true,
      isOverlapping: false,
    });
  } else if (strategy === 'redistribute') {
    // Smartly redistribute boundaries so each clip absorbs a fraction of remainder
    // e.g., if remainder > 50% of selected duration, create (fullClipCount + 1) clips of equal length;
    // otherwise divide across fullClipCount clips.
    const targetCount = remainder >= selectedDuration * 0.5 ? fullClipCount + 1 : fullClipCount;
    const adjustedDuration = Math.round((sourceDuration / targetCount) * 1000) / 1000;

    for (let i = 0; i < targetCount; i++) {
      const start = Math.round(i * adjustedDuration * 1000) / 1000;
      const end = i === targetCount - 1 ? sourceDuration : Math.round((i + 1) * adjustedDuration * 1000) / 1000;
      clips.push({
        index: i + 1,
        startTime: start,
        endTime: end,
        duration: Math.round((end - start) * 1000) / 1000,
        isRemainder: false,
        isOverlapping: false,
      });
    }
  } else if (strategy === 'controlled-overlap') {
    // Full clips + an additional full target-length clip anchored at the end of the video
    for (let i = 0; i < fullClipCount; i++) {
      const start = Math.round(i * selectedDuration * 1000) / 1000;
      const end = Math.round((i + 1) * selectedDuration * 1000) / 1000;
      clips.push({
        index: i + 1,
        startTime: start,
        endTime: end,
        duration: Math.round((end - start) * 1000) / 1000,
        isRemainder: false,
        isOverlapping: false,
      });
    }
    // Overlapping clip of length selectedDuration ending at sourceDuration
    const overlapStart = Math.max(0, Math.round((sourceDuration - selectedDuration) * 1000) / 1000);
    clips.push({
      index: fullClipCount + 1,
      startTime: overlapStart,
      endTime: sourceDuration,
      duration: selectedDuration,
      isRemainder: false,
      isOverlapping: true,
    });
  }

  return {
    sourceDuration,
    selectedDuration,
    fullClipCount,
    remainder,
    estimatedOutputs: clips.length,
    strategy,
    clips,
  };
}

/**
 * Format seconds to standard mm:ss or hh:mm:ss format
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
