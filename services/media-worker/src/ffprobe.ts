import { spawn } from 'node:child_process';
import type { VideoMetadata } from '@shorts/shared';

export interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  display_aspect_ratio?: string;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  bit_rate?: string;
  channels?: number;
  sample_rate?: string;
  color_transfer?: string;
  color_space?: string;
  color_primaries?: string;
  side_data_list?: Array<{ rotation?: number }>;
  tags?: Record<string, string>;
}

export interface FfprobeFormat {
  duration?: string;
  size?: string;
  bit_rate?: string;
}

export interface FfprobeOutput {
  streams?: FfprobeStream[];
  format?: FfprobeFormat;
}

/**
 * Executes ffprobe safely using an argument array without shell execution.
 */
export async function probeVideo(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    const child = spawn('ffprobe', args, {
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn ffprobe: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
      }

      try {
        const parsed: FfprobeOutput = JSON.parse(stdout);
        const format = parsed.format || {};
        const streams = parsed.streams || [];

        const videoStream = streams.find((s) => s.codec_type === 'video');
        const audioStream = streams.find((s) => s.codec_type === 'audio');

        if (!videoStream) {
          throw new Error('No video stream found in the source file');
        }

        const width = videoStream.width || 0;
        const height = videoStream.height || 0;

        // Calculate aspect ratio string
        let displayAspectRatio = videoStream.display_aspect_ratio;
        if (!displayAspectRatio || displayAspectRatio === '0:1') {
          if (width > 0 && height > 0) {
            displayAspectRatio = `${width}:${height}`;
          } else {
            displayAspectRatio = '16:9';
          }
        }

        // Frame rate calculation
        let frameRate = 30.0;
        const rateStr = videoStream.avg_frame_rate || videoStream.r_frame_rate || '30/1';
        if (rateStr.includes('/')) {
          const [num, den] = rateStr.split('/').map(Number);
          if (den && den > 0) {
            frameRate = Math.round((num / den) * 100) / 100;
          }
        } else {
          frameRate = parseFloat(rateStr) || 30.0;
        }

        // Duration calculation
        const durationSeconds = parseFloat(format.duration || '0');

        // Bitrate calculation
        const bitrateKbps = Math.round(
          parseInt(format.bit_rate || videoStream.bit_rate || '0', 10) / 1000
        );

        // Rotation metadata
        let rotation = 0;
        if (videoStream.side_data_list) {
          for (const side of videoStream.side_data_list) {
            if (typeof side.rotation === 'number') {
              rotation = side.rotation;
            }
          }
        }
        if (rotation === 0 && videoStream.tags && videoStream.tags['rotate']) {
          rotation = parseInt(videoStream.tags['rotate'], 10) || 0;
        }

        // HDR detection
        const colorTransfer = videoStream.color_transfer || '';
        const isHDR =
          colorTransfer.includes('smpte2084') ||
          colorTransfer.includes('arib-std-b67') ||
          colorTransfer.includes('hdr');

        const metadata: VideoMetadata = {
          durationSeconds: Math.round(durationSeconds * 1000) / 1000,
          width,
          height,
          displayAspectRatio,
          frameRate,
          videoCodec: videoStream.codec_name || 'unknown',
          bitrateKbps: bitrateKbps || 2500,
          audioCodec: audioStream?.codec_name,
          audioChannels: audioStream?.channels,
          audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate, 10) : undefined,
          rotation,
          isHDR,
          colorSpace: videoStream.color_space || videoStream.color_primaries,
          fileSizeBytes: parseInt(format.size || '0', 10),
        };

        resolve(metadata);
      } catch (err: any) {
        reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
      }
    });
  });
}

/**
 * Validates a newly rendered video file to guarantee integrity.
 * Section 34 Render Quality Validation requirement.
 */
export async function validateRenderOutput(
  filePath: string,
  expectedWidth: number,
  expectedHeight: number,
  expectedDuration: number,
  toleranceSeconds: number = 2.0
): Promise<{ isValid: boolean; error?: string; metadata?: VideoMetadata }> {
  try {
    const meta = await probeVideo(filePath);

    if (meta.fileSizeBytes <= 0) {
      return { isValid: false, error: 'File size is 0 bytes' };
    }

    if (meta.width !== expectedWidth || meta.height !== expectedHeight) {
      return {
        isValid: false,
        error: `Dimension mismatch: expected ${expectedWidth}x${expectedHeight}, got ${meta.width}x${meta.height}`,
      };
    }

    const durationDiff = Math.abs(meta.durationSeconds - expectedDuration);
    if (durationDiff > toleranceSeconds) {
      return {
        isValid: false,
        error: `Duration divergence: expected ${expectedDuration}s, got ${meta.durationSeconds}s (diff: ${durationDiff}s)`,
      };
    }

    return { isValid: true, metadata: meta };
  } catch (err: any) {
    return { isValid: false, error: err.message };
  }
}
