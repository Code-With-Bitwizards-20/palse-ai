import { runMediaPipeline, type PipelineOptions, type PipelineResult } from './pipeline.js';

export async function processVideoJob(options: PipelineOptions): Promise<PipelineResult> {
  console.log(`[Worker] Starting job ${options.jobId} for project ${options.projectId}`);
  const result = await runMediaPipeline(options);
  console.log(`[Worker] Finished job ${options.jobId}: generated ${result.totalClips} Shorts`);
  return result;
}

export * from './pipeline.js';
export * from './ffprobe.js';
export * from './ffmpeg.js';
export * from './reframe.js';
export * from './subtitles.js';
export * from './aiProvider.js';
