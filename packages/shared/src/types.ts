import type { PlatformId } from '@shorts/platform-presets';

export type JobStage =
  | 'UPLOADING'
  | 'INSPECTING_MEDIA'
  | 'EXTRACTING_AUDIO'
  | 'TRANSCRIBING'
  | 'UNDERSTANDING_CONTENT'
  | 'DETECTING_SPEAKERS'
  | 'ANALYZING_SCENES'
  | 'CREATING_SHORTS'
  | 'SMART_REFRAMING'
  | 'GENERATING_HOOKS'
  | 'GENERATING_CAPTIONS'
  | 'APPLYING_EDITS'
  | 'RENDERING'
  | 'ENCODING_60FPS'
  | 'QUALITY_CHECKS'
  | 'PREPARING_DOWNLOADS'
  | 'COMPLETED'
  | 'FAILED';

export interface StageInfo {
  stage: JobStage;
  label: string;
  weightPercent: number; // percentage of overall 0-100 pipeline
}

export const PIPELINE_STAGES: StageInfo[] = [
  { stage: 'UPLOADING', label: 'Uploading source media', weightPercent: 5 },
  { stage: 'INSPECTING_MEDIA', label: 'Inspecting media streams & metadata', weightPercent: 5 },
  { stage: 'EXTRACTING_AUDIO', label: 'Extracting 16kHz audio master', weightPercent: 5 },
  { stage: 'TRANSCRIBING', label: 'Transcribing speech & word timestamps', weightPercent: 12 },
  { stage: 'UNDERSTANDING_CONTENT', label: 'Understanding content & topics', weightPercent: 8 },
  { stage: 'DETECTING_SPEAKERS', label: 'Detecting speakers & diarization', weightPercent: 5 },
  { stage: 'ANALYZING_SCENES', label: 'Analyzing visual scenes & cuts', weightPercent: 5 },
  { stage: 'CREATING_SHORTS', label: 'Calculating clip boundaries', weightPercent: 5 },
  { stage: 'SMART_REFRAMING', label: 'Computing smart 9:16 reframe focal path', weightPercent: 10 },
  { stage: 'GENERATING_HOOKS', label: 'Generating content-grounded hooks', weightPercent: 5 },
  { stage: 'GENERATING_CAPTIONS', label: 'Generating styled karaoke captions', weightPercent: 5 },
  { stage: 'APPLYING_EDITS', label: 'Applying pacing, zooms & audio sweetening', weightPercent: 5 },
  { stage: 'RENDERING', label: 'Compositing video filtergraph', weightPercent: 12 },
  { stage: 'ENCODING_60FPS', label: 'Encoding 60 FPS CFR output', weightPercent: 8 },
  { stage: 'QUALITY_CHECKS', label: 'Validating stream health with ffprobe', weightPercent: 3 },
  { stage: 'PREPARING_DOWNLOADS', label: 'Packaging multi-resolution exports', weightPercent: 2 },
];

export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  displayAspectRatio: string;
  frameRate: number;
  videoCodec: string;
  bitrateKbps: number;
  audioCodec?: string;
  audioChannels?: number;
  audioSampleRate?: number;
  rotation?: number;
  isHDR?: boolean;
  colorSpace?: string;
  fileSizeBytes: number;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words: WordTimestamp[];
}

export interface FullTranscript {
  language: string;
  text: string;
  segments: TranscriptSegment[];
}

export interface HookOption {
  id: string;
  type:
    | 'curiosity'
    | 'question'
    | 'bold-statement'
    | 'problem-solution'
    | 'contrarian'
    | 'story'
    | 'surprise'
    | 'educational'
    | 'emotional'
    | 'cliffhanger';
  text: string;
  spokenSnippet?: string;
  rationale: string;
}

export interface SocialPostingCopy {
  platform: PlatformId;
  title: string;
  caption: string;
  description: string;
  hashtags: string[];
  cta: string;
  thumbnailText: string;
  suggestedCoverTimestamp: number;
}

export interface CropKeyframe {
  timestamp: number;
  centerXPercent: number; // 0 to 100
  centerYPercent: number;
  scale: number; // 1.0 = standard 9:16 crop window
}

export interface RenderVariant {
  resolutionTier: '1080p' | '2k' | '4k';
  targetFps: number;
  filePath: string;
  downloadUrl: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  validated: boolean;
  createdAt: string;
}

export interface GeneratedClip {
  id: string;
  projectId: string;
  clipIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  mainTopic: string;
  summary: string;
  engagementPotential: number; // 0 to 100
  engagementRationale: string;
  selectedHook: HookOption;
  alternativeHooks: HookOption[];
  transcriptSegments: TranscriptSegment[];
  subtitleThemeId: string;
  reframeStrategy: string;
  cropTimeline: CropKeyframe[];
  socialMetadata: Record<PlatformId, SocialPostingCopy>;
  cleanFilename: string;
  detailedFilename: string;
  renders: Record<string, RenderVariant>;
  previewVideoUrl?: string;
  previewThumbnailUrl?: string;
  srtUrl?: string;
  vttUrl?: string;
  cleanNoCaptionsVideoUrl?: string;
}

export interface JobProgressEvent {
  jobId: string;
  projectId: string;
  stage: JobStage;
  stageLabel: string;
  percent: number; // 0 to 100
  estimatedRemainingSeconds?: number;
  currentClipIndex?: number;
  totalClips?: number;
  errorMessage?: string;
  timestamp: string;
}
