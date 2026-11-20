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

// ─────────────────────────── Hardware Detection ───────────────────────────────

export interface HardwareInfo {
  encoderType: 'GPU' | 'CPU';
  encoderName: 'h264_nvenc' | 'h264_qsv' | 'h264_amf' | 'libx264';
  ffmpegVersion: string;
}

/**
 * Detect the best available hardware video encoder at startup.
 * Runs `ffmpeg -encoders` to list available encoders, then validates
 * each GPU encoder with a 1-frame null test before committing.
 */
export async function detectWorkerHardware(): Promise<HardwareInfo> {
  const ffmpegVersion = await getFfmpegVersion();

  // List available encoders
  const encodersList = await runCommandText('ffmpeg', ['-encoders', '-hide_banner']);

  // GPU encoder candidates in priority order
  const gpuCandidates: Array<{ name: HardwareInfo['encoderName']; pattern: RegExp }> = [
    { name: 'h264_nvenc', pattern: /h264_nvenc/ },
    { name: 'h264_qsv',   pattern: /h264_qsv/ },
    { name: 'h264_amf',   pattern: /h264_amf/ },
  ];

  for (const candidate of gpuCandidates) {
    if (!candidate.pattern.test(encodersList)) continue;
    // Validate with a 1-frame null encode
    const ok = await testEncoder(candidate.name);
    if (ok) {
      const result: HardwareInfo = {
        encoderType: 'GPU',
        encoderName: candidate.name,
        ffmpegVersion,
      };
      detectedEncoder = result;
      return result;
    }
  }

  // Fall back to CPU libx264
  const result: HardwareInfo = {
    encoderType: 'CPU',
    encoderName: 'libx264',
    ffmpegVersion,
  };
  detectedEncoder = result;
  return result;
}

/** Module-level detected encoder — set once at startup by detectWorkerHardware(). */
export let detectedEncoder: HardwareInfo = {
  encoderType: 'CPU',
  encoderName: 'libx264',
  ffmpegVersion: 'unknown',
};

// ─────────────────────────── Internal helpers ──────────────────────────────────

async function getFfmpegVersion(): Promise<string> {
  try {
    const output = await runCommandText('ffmpeg', ['-version', '-hide_banner']);
    const match = output.match(/ffmpeg version ([^\s]+)/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

async function testEncoder(encoderName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const args = [
      '-hide_banner',
      '-loglevel', 'error',
      '-f', 'lavfi',
      '-i', 'nullsrc=s=256x256:r=1',
      '-vframes', '1',
      '-c:v', encoderName,
      '-f', 'null',
      '-',
    ];
    const child = spawn('ffmpeg', args, { windowsHide: true });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

function runCommandText(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let out = '';
    let err = '';
    child.stdout?.on('data', (c: Buffer) => { out += c.toString(); });
    child.stderr?.on('data', (c: Buffer) => { err += c.toString(); });
    child.on('error', reject);
    child.on('close', () => resolve(out + err));
  });
}

// ─────────────────────────── runFfmpeg ────────────────────────────────────────

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
