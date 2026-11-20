export type SourceType =
  | 'local-file'
  | 'direct-media-url'
  | 'authorized-provider'
  | 'manual-assisted';

export type ImportStatus =
  | 'idle'
  | 'validating'
  | 'checking-cors'
  | 'downloading'
  | 'probing'
  | 'ready'
  | 'unsupported'
  | 'cors-blocked'
  | 'failed'
  | 'cancelled';

export interface MediaMetadata {
  filename: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  fileSizeBytes: number;
  mimeType: string;
  hasAudio: boolean;
  aspectRatio: string;
}

export interface MediaSourceResult {
  type: SourceType;
  status: ImportStatus;
  file?: File;
  mediaUrl?: string;
  metadata?: MediaMetadata;
  error?: string;
  platformSuggestion?: {
    platform: string;
    instructions: string[];
    officialUrl?: string;
  };
}

export interface DirectMediaProgress {
  bytesLoaded: number;
  totalBytes: number;
  percent: number;
  speedBytesPerSec?: number;
}
