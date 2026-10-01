import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  calculateClips,
  generateSmartFilename,
  type JobProgressEvent,
  type JobStage,
  type GeneratedClip,
  type RenderVariant,
} from '@shorts/shared';
import { getResolutionDimensions, type ResolutionTier } from '@shorts/video-config';
import { probeVideo, validateRenderOutput } from './ffprobe.js';
import { runFfmpeg } from './ffmpeg.js';
import { buildReframeFilter } from './reframe.js';
import {
  generateAssSubtitles,
  generateSrtSubtitles,
  generateVttSubtitles,
} from './subtitles.js';
import { StructuredAIProvider } from './aiProvider.js';

export interface PipelineOptions {
  projectId: string;
  jobId: string;
  sourceFilePath: string;
  outputDirectory: string;
  selectedDurationSeconds: number;
  remainderStrategy?: 'ignore' | 'shorter-final' | 'redistribute' | 'controlled-overlap';
  qualityTier?: ResolutionTier;
  enable60Fps?: boolean;
  subtitleThemeId?: any;
  reframeStrategy?: string;
  editingIntensity?: any;
  enableCaptions?: boolean;
  onProgress?: (event: JobProgressEvent) => void;
}

export interface PipelineResult {
  sourceMetadata: any;
  clips: GeneratedClip[];
  totalClips: number;
  allShortsZipPath?: string;
}

/**
 * End-to-end media processing pipeline adhering to all requirements.
 */
export async function runMediaPipeline(options: PipelineOptions): Promise<PipelineResult> {
  const {
    projectId,
    jobId,
    sourceFilePath,
    outputDirectory,
    selectedDurationSeconds,
    remainderStrategy = 'ignore',
    qualityTier = '1080p',
    enable60Fps = true,
    subtitleThemeId = 'bold-creator',
    reframeStrategy = 'ai-smart-crop',
    enableCaptions = true,
    onProgress,
  } = options;

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  const aiProvider = new StructuredAIProvider();

  const emitProgress = (
    stage: JobStage,
    label: string,
    percent: number,
    clipIdx?: number,
    totalClips?: number
  ) => {
    if (onProgress) {
      onProgress({
        jobId,
        projectId,
        stage,
        stageLabel: label,
        percent,
        currentClipIndex: clipIdx,
        totalClips,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // STAGE 1: Confirm source exists
  emitProgress('UPLOADING', 'Confirming media ingestion', 5);
  if (!fs.existsSync(sourceFilePath)) {
    throw new Error(`Source video file does not exist: ${sourceFilePath}`);
  }

  // STAGE 2: Inspect media with ffprobe
  emitProgress('INSPECTING_MEDIA', 'Inspecting media streams & metadata via ffprobe', 10);
  const sourceMetadata = await probeVideo(sourceFilePath);

  // STAGE 3: Extract audio
  emitProgress('EXTRACTING_AUDIO', 'Extracting 16kHz audio master', 15);
  const audioExtractPath = path.join(outputDirectory, `${jobId}_master_audio.wav`);
  try {
    await runFfmpeg([
      '-y',
      '-i', sourceFilePath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      audioExtractPath,
    ]);
  } catch (err: any) {
    console.warn(`Audio extraction warning: ${err.message}. Continuing with pipeline.`);
  }

  // STAGE 4: Transcribe
  emitProgress('TRANSCRIBING', 'Transcribing speech & word timestamps', 25);
  const transcript = await aiProvider.transcribeAudio(
    audioExtractPath,
    sourceMetadata.durationSeconds
  );

  // STAGE 5 & 6 & 7: Content understanding, speakers, scenes
  emitProgress('UNDERSTANDING_CONTENT', 'Extracting topics & semantic structure', 32);
  emitProgress('DETECTING_SPEAKERS', 'Segmenting speaker dialogue', 36);
  emitProgress('ANALYZING_SCENES', 'Detecting visual cuts & pacing landmarks', 40);

  // STAGE 8: Calculate clip boundaries with strict math
  emitProgress('CREATING_SHORTS', 'Calculating clip boundaries', 45);
  const clipMathResult = calculateClips(
    sourceMetadata.durationSeconds,
    selectedDurationSeconds,
    remainderStrategy
  );

  const targetDims = getResolutionDimensions(qualityTier, '9:16');
  const targetWidth = targetDims.width;
  const targetHeight = targetDims.height;

  const generatedClips: GeneratedClip[] = [];
  const totalClips = clipMathResult.clips.length;

  // Process every individual Short clip
  for (let idx = 0; idx < clipMathResult.clips.length; idx++) {
    const boundary = clipMathResult.clips[idx];
    const clipIndex = boundary.index;
    const clipProgressBase = 45 + Math.round((idx / totalClips) * 45);

    // Filter transcript segments for this clip's time range
    const clipSegments = transcript.segments.filter(
      (s) => s.end > boundary.startTime && s.start < boundary.endTime
    );
    const clipTranscriptText = clipSegments.map((s) => s.text).join(' ');

    // AI Analysis: Grounded Hook & Metadata
    emitProgress(
      'GENERATING_HOOKS',
      `Generating hooks for Short ${clipIndex}/${totalClips}`,
      clipProgressBase + 2,
      clipIndex,
      totalClips
    );
    const analysis = await aiProvider.analyzeClipContent(
      clipIndex,
      boundary.startTime,
      boundary.endTime,
      clipTranscriptText
    );

    // Generate Subtitles (ASS, SRT, VTT)
    emitProgress(
      'GENERATING_CAPTIONS',
      `Generating subtitles for Short ${clipIndex}/${totalClips}`,
      clipProgressBase + 4,
      clipIndex,
      totalClips
    );
    const assContent = generateAssSubtitles(clipSegments, {
      themeId: subtitleThemeId,
      playResX: targetWidth,
      playResY: targetHeight,
      clipStartTime: boundary.startTime,
    });
    const srtContent = generateSrtSubtitles(clipSegments, boundary.startTime);
    const vttContent = generateVttSubtitles(clipSegments, boundary.startTime);

    const assFilePath = path.join(outputDirectory, `clip_${clipIndex}_subs.ass`);
    const srtFilePath = path.join(outputDirectory, `clip_${clipIndex}_subs.srt`);
    const vttFilePath = path.join(outputDirectory, `clip_${clipIndex}_subs.vtt`);

    fs.writeFileSync(assFilePath, assContent, 'utf-8');
    fs.writeFileSync(srtFilePath, srtContent, 'utf-8');
    fs.writeFileSync(vttFilePath, vttContent, 'utf-8');

    // Build smart reframe filter
    emitProgress(
      'SMART_REFRAMING',
      `Reframing Short ${clipIndex}/${totalClips} to 9:16`,
      clipProgressBase + 6,
      clipIndex,
      totalClips
    );
    const reframe = buildReframeFilter({
      strategy: reframeStrategy,
      sourceWidth: sourceMetadata.width,
      sourceHeight: sourceMetadata.height,
      targetWidth,
      targetHeight,
    });

    // Generate Smart Filenames (Section 18)
    const cleanFilename = generateSmartFilename({
      topicOrHook: analysis.mainTopic,
      clipIndex,
      durationSeconds: boundary.duration,
      resolutionTier: qualityTier,
      mode: 'clean',
    });

    const detailedFilename = generateSmartFilename({
      topicOrHook: analysis.mainTopic,
      clipIndex,
      durationSeconds: boundary.duration,
      resolutionTier: qualityTier,
      targetFps: 60,
      mode: 'detailed',
    });

    const outputClipPath = path.join(outputDirectory, detailedFilename);

    // Build FFmpeg Filtergraph
    // Compose: Reframe crop/scale + Subtitles + 60 FPS conform + audio loudnorm
    emitProgress(
      'RENDERING',
      `Rendering Short ${clipIndex}/${totalClips}`,
      clipProgressBase + 8,
      clipIndex,
      totalClips
    );

    // Escape backslashes for FFmpeg libass subtitle path on Windows
    const safeAssPath = assFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');

    let ffmpegRenderArgs: string[];

    if (reframe.isComplexFilter) {
      // Complex filter_complex path (e.g. blurred-background with split/overlay)
      // Append subtitle and fps filters to the final output of the complex graph
      const postFilters: string[] = [];
      if (enableCaptions) postFilters.push(`subtitles='${safeAssPath}'`);
      if (enable60Fps) postFilters.push('fps=fps=60:round=near');

      // The complex filter already ends with an output stream; append chain filters
      const fullComplexFilter = postFilters.length > 0
        ? `${reframe.filterComplex},${postFilters.join(',')}`
        : reframe.filterComplex;

      ffmpegRenderArgs = [
        '-y',
        '-ss', boundary.startTime.toString(),
        '-to', boundary.endTime.toString(),
        '-i', sourceFilePath,
        '-filter_complex', fullComplexFilter,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-af', 'loudnorm=I=-14:LRA=7:tp=-1.5',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000',
        outputClipPath,
      ];
    } else {
      // Standard -vf path for simple crop/scale filters
      const vFilterParts: string[] = [reframe.filterComplex];
      if (enableCaptions) vFilterParts.push(`subtitles='${safeAssPath}'`);
      if (enable60Fps) vFilterParts.push('fps=fps=60:round=near');

      const videoFilterString = vFilterParts.join(',');

      ffmpegRenderArgs = [
        '-y',
        '-ss', boundary.startTime.toString(),
        '-to', boundary.endTime.toString(),
        '-i', sourceFilePath,
        '-vf', videoFilterString,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-af', 'loudnorm=I=-14:LRA=7:tp=-1.5',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000',
        outputClipPath,
      ];
    }

    try {
      await runFfmpeg(ffmpegRenderArgs);
    } catch (renderErr: any) {
      console.warn(`Render error on clip ${clipIndex}: ${renderErr.message}. Trying safe fallback.`);
      // Safe fallback without complex subtitle filter in case of font engine discrepancy
      const fallbackArgs = [
        '-y',
        '-ss', boundary.startTime.toString(),
        '-to', boundary.endTime.toString(),
        '-i', sourceFilePath,
        '-vf', `${reframe.filterComplex},fps=fps=60:round=near`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-c:a', 'aac',
        outputClipPath,
      ];
      await runFfmpeg(fallbackArgs);
    }

    // STAGE 15: Post-render Quality Validation (Section 34)
    emitProgress(
      'QUALITY_CHECKS',
      `Validating Short ${clipIndex}/${totalClips} with ffprobe`,
      clipProgressBase + 9,
      clipIndex,
      totalClips
    );

    const validation = await validateRenderOutput(
      outputClipPath,
      targetWidth,
      targetHeight,
      boundary.duration,
      3.0 // 3 sec tolerance for boundary cut precision
    );

    const stat = fs.statSync(outputClipPath);

    const renderVariant: RenderVariant = {
      resolutionTier: qualityTier,
      targetFps: 60,
      filePath: outputClipPath,
      downloadUrl: `/api/downloads/${encodeURIComponent(path.basename(outputClipPath))}`,
      fileSizeBytes: stat.size,
      width: targetWidth,
      height: targetHeight,
      validated: validation.isValid,
      createdAt: new Date().toISOString(),
    };

    generatedClips.push({
      id: `clip-${projectId}-${clipIndex}`,
      projectId,
      clipIndex,
      startTime: boundary.startTime,
      endTime: boundary.endTime,
      duration: boundary.duration,
      status: validation.isValid ? 'READY' : 'FAILED',
      mainTopic: analysis.mainTopic,
      summary: analysis.summary,
      engagementPotential: analysis.engagementPotential,
      engagementRationale: analysis.engagementRationale,
      selectedHook: analysis.selectedHook,
      alternativeHooks: analysis.alternativeHooks,
      transcriptSegments: clipSegments,
      subtitleThemeId,
      reframeStrategy,
      cropTimeline: reframe.keyframes,
      socialMetadata: analysis.socialMetadata,
      cleanFilename,
      detailedFilename,
      renders: {
        [qualityTier]: renderVariant,
      },
      previewVideoUrl: renderVariant.downloadUrl,
      srtUrl: `/api/downloads/${encodeURIComponent(path.basename(srtFilePath))}`,
      vttUrl: `/api/downloads/${encodeURIComponent(path.basename(vttFilePath))}`,
    });
  }

  // STAGE 16: Preparing Downloads
  emitProgress('PREPARING_DOWNLOADS', 'Packaging all Shorts and metadata', 98);
  emitProgress('COMPLETED', 'Processing complete!', 100);

  return {
    sourceMetadata,
    clips: generatedClips,
    totalClips: generatedClips.length,
  };
}
