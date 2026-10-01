import { spawn } from 'node:child_process';

export interface FfmpegProgress {
  frame?: number;
  fps?: number;
  total_size?: number;
  out_time_us?: number;
  out_time_ms?: number;
  out_time?: string;
  speed?: string;
  progressPercent?: number;
}

export type FfmpegProgressCallback = (progress: FfmpegProgress) => void;

/**
 * Execute FFmpeg safely using structured argument array without shell execution.
 * Parses stdout/stderr for deterministic progress updates.
 */
export async function runFfmpeg(
  args: string[],
  onProgress?: FfmpegProgressCallback,
  totalDurationSeconds?: number
): Promise<{ success: boolean; stderr: string }> {
  return new Promise((resolve, reject) => {
    // Add progress to pipe:1 if progress monitoring requested
    const fullArgs = onProgress ? ['-progress', 'pipe:1', ...args] : args;

    const child = spawn('ffmpeg', fullArgs, {
      windowsHide: true,
    });

    let stderr = '';

    if (onProgress) {
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        const lines = text.split('\n');
        const progressObj: FfmpegProgress = {};

        for (const line of lines) {
          const [key, val] = line.trim().split('=');
          if (!key || !val) continue;

          if (key === 'frame') progressObj.frame = parseInt(val, 10);
          if (key === 'fps') progressObj.fps = parseFloat(val);
          if (key === 'total_size') progressObj.total_size = parseInt(val, 10);
          if (key === 'out_time_us') {
            const us = parseInt(val, 10);
            progressObj.out_time_us = us;
            if (totalDurationSeconds && totalDurationSeconds > 0) {
              const currentSeconds = us / 1000000;
              const pct = Math.min(100, Math.max(0, (currentSeconds / totalDurationSeconds) * 100));
              progressObj.progressPercent = Math.round(pct * 10) / 10;
            }
          }
          if (key === 'out_time') progressObj.out_time = val;
          if (key === 'speed') progressObj.speed = val;
        }

        if (Object.keys(progressObj).length > 0) {
          onProgress(progressObj);
        }
      });
    }

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stderr });
      } else {
        reject(new Error(`FFmpeg exited with code ${code}\nStderr: ${stderr.slice(-1500)}`));
      }
    });
  });
}
