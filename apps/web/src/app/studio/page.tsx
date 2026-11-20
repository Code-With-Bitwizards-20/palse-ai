'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Upload,
  Video,
  Sparkles,
  Sliders,
  Play,
  Pause,
  Download,
  Cloud,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Settings,
  Flame,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Tv,
  Volume2,
  VolumeX,
  Pencil,
  CheckSquare,
  Search,
  Gamepad2,
  Bot,
  Scissors,
  Wand2,
  Link2,
  ServerCrash,
  RotateCcw,
  ArrowRight,
  CircleCheck,
} from 'lucide-react';
import { calculateClips, RemainderStrategy } from '@shorts/shared';
import { PLATFORM_PRESETS, PlatformId } from '@shorts/platform-presets';
import {
  generateHooks,
  generateLocalShortFilename,
  evaluateEngagementPotential,
  AIMode,
  GeneratedHook,
  EngagementBreakdown,
} from '@/lib/localAI';
import {
  SUBTITLE_THEMES,
  SubtitleThemeId,
  SubtitleCue,
  exportToSrt,
  exportToVtt,
} from '@/lib/subtitles';
import { APP_CONFIG } from '@/config/app';
import { DualSourceDropzone } from '@/features/ingestion/components/DualSourceDropzone';
import type { GamingProfile } from '@/lib/gamingClipper';
import type { CandidateClip } from '@/lib/highlightDetector';
import { YouTubeTimestampStudio } from '@/components/YouTubeTimestampStudio';
import { FindMomentsModal } from '@/components/FindMomentsModal';
import { ClipEditorModal } from '@/components/ClipEditorModal';
import { clientProjectStore, ClientProject } from '@/lib/indexedDBStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClippingEngineMode = 'ai-clipping' | 'gaming-clipping' | 'find-moments' | 'math-split';

/** Reframe strategies sent to the cloud worker */
export type ReframeStrategy = 'AI Smart' | 'Gameplay' | 'Face Focus' | 'Center' | 'Fit + Blur';

/** Editing style (kept for clip plan UI) */
export type EditingStyle = 'Clean' | 'Balanced' | 'High Energy' | 'Extreme';

/** A planned short in the pre-submit clip plan */
interface ShortItem {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  filename: string;
  topic: string;
  hook: GeneratedHook;
  engagement: EngagementBreakdown;
  status: 'idle' | 'queued' | 'ready' | 'error';
  score?: number;
  explanation?: string;
}

/** A completed cloud-rendered clip returned in job results */
interface CompletedClip {
  clipIndex: number;
  mainTopic: string;
  startTime: number;
  endTime: number;
  duration: number;
  engagementPotential: number;
  selectedHook?: { text: string };
  cleanFilename: string;
  mp4File?: string;
  srtFile?: string;
  vttFile?: string;
}

// Upload result from /api/upload proxy
interface UploadResult {
  filePath: string;
  jobId: string;
  originalName?: string;
  sizeBytes?: number;
}

// Phase progression
type StudioPhase = 'source' | 'options' | 'processing' | 'results';

// ─── Source Tab ───────────────────────────────────────────────────────────────

type SourceTab = 'upload' | 'url';

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StudioPage() {
  // ── Phase ──
  const [phase, setPhase] = useState<StudioPhase>('source');

  // ── Source Tab ──
  const [sourceTab, setSourceTab] = useState<SourceTab>('upload');

  // ── Upload / URL result ──
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [urlImportValue, setUrlImportValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Job state ──
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [completedClips, setCompletedClips] = useState<CompletedClip[]>([]);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [jobStage, setJobStage] = useState<string>('');
  const [jobPercent, setJobPercent] = useState<number>(0);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // ── Video source info (populated after upload for local preview plan) ──
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(120); // default estimate
  const [videoWidth, setVideoWidth] = useState<number>(1920);
  const [videoHeight, setVideoHeight] = useState<number>(1080);
  const [videoFps, setVideoFps] = useState<number>(30);

  // ── Clipping mode ──
  const [clippingMode, setClippingMode] = useState<ClippingEngineMode>('ai-clipping');
  const [gamingProfile, setGamingProfile] = useState<GamingProfile>('GTA VI Gameplay');

  // ── Options ──
  const [clipDuration, setClipDuration] = useState<number>(30);
  const [clipCountTarget, setClipCountTarget] = useState<number>(5);
  const [remainderStrategy, setRemainderStrategy] = useState<RemainderStrategy>('ignore');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('universal');
  const [reframeStrategy, setReframeStrategy] = useState<ReframeStrategy>('AI Smart');
  const [editingStyle, setEditingStyle] = useState<EditingStyle>('Balanced');
  const [resolutionTier, setResolutionTier] = useState<'1080p' | '2k' | '4k'>('1080p');
  const [subtitleThemeId, setSubtitleThemeId] = useState<SubtitleThemeId>('creator');
  const [qualityTier, setQualityTier] = useState<'standard' | 'high' | 'max'>('high');

  // ── Subtitle cues (AI-generated preview) ──
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([
    { id: 'c1', startTime: 0, endTime: 3.2, text: 'This secret changes everything about creating shorts.' },
    { id: 'c2', startTime: 3.2, endTime: 7.0, text: 'You no longer need expensive cloud servers or subscriptions.' },
    { id: 'c3', startTime: 7.0, endTime: 12.0, text: 'Everything processes in the cloud with hardware acceleration.' },
    { id: 'c4', startTime: 12.0, endTime: 18.0, text: 'Download your clips anywhere, on any device.' },
  ]);

  // ── Clip plan (heuristic preview before submission) ──
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [activeShortIndex, setActiveShortIndex] = useState<number>(0);

  // ── Source Notice & YouTube Preview State (No Client Audio Processing) ──
  const [sourceNotice, setSourceNotice] = useState<{
    type: 'youtube' | 'twitch' | 'vimeo' | 'unsupported' | 'error';
    title: string;
    message: string;
    guidance?: string;
    code?: string;
    videoId?: string;
    videoTitle?: string;
    author?: string;
    thumbnailUrl?: string;
    url?: string;
  } | null>(null);
  const [youtubePreviewId, setYoutubePreviewId] = useState<string | null>(null);
  const [youtubeMetadata, setYoutubeMetadata] = useState<{ title?: string; author?: string; url?: string } | null>(null);

  // ── Modals ──
  const [isFindMomentsOpen, setIsFindMomentsOpen] = useState(false);
  const [editingClipIndex, setEditingClipIndex] = useState<number | null>(null);

  // ── Inline filename renaming ──
  const [editingFilenameIdx, setEditingFilenameIdx] = useState<number | null>(null);
  const [editingFilenameValue, setEditingFilenameValue] = useState('');

  // ── SSE connection ref ──
  const sseRef = useRef<EventSource | null>(null);

  // ─── Computed ───────────────────────────────────────────────────────────────

  const targetDims = useMemo(() => {
    switch (resolutionTier) {
      case '4k':  return { width: 2160, height: 3840, bitrate: 35_000_000 };
      case '2k':  return { width: 1440, height: 2560, bitrate: 18_000_000 };
      case '1080p':
      default:    return { width: 1080, height: 1920, bitrate: 10_000_000 };
    }
  }, [resolutionTier]);

  const currentPlatformPreset = PLATFORM_PRESETS[selectedPlatform] || PLATFORM_PRESETS.universal;

  // ─── Clip Plan Generation (heuristic preview - purely metadata, NO client audio decoding) ───

  useEffect(() => {
    if (videoDuration <= 0) return;
    try {
      let items: ShortItem[] = [];

      // Generate baseline clip boundaries using mathematical distribution for the EDL plan
      const result = calculateClips(videoDuration, clipDuration, remainderStrategy);
      items = result.clips.map((clip) => {
        let topic = `Segment #${clip.index}`;
        let pacing = 'Cloud-rendered pacing';
        if (clippingMode === 'gaming-clipping') {
          topic = `${gamingProfile} Highlight #${clip.index}`;
          pacing = `${gamingProfile} action burst detected on cloud worker.`;
        } else if (clippingMode === 'ai-clipping') {
          topic = `AI Key Highlight #${clip.index}`;
          pacing = 'Acoustic energy & speech pause alignment by cloud worker.';
        }

        const dummyTranscript = `Clip ${clip.index}: Highlights from ${clip.startTime}s to ${clip.endTime}s.`;
        const hooks = generateHooks(dummyTranscript, topic);
        const primaryHook = hooks[0] || {
          id: `hook-${clip.index}`,
          category: 'Curiosity',
          text: topic,
          suggestedDurationSeconds: 3.0,
        };
        const engagement = evaluateEngagementPotential(dummyTranscript, clip.duration, true);
        const filename = generateLocalShortFilename(topic, clip.index, clip.duration, resolutionTier, 60);

        return {
          id: `short-${clip.index}`,
          index: clip.index,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          filename,
          topic,
          hook: primaryHook,
          engagement: {
            ...engagement,
            pacingNote: pacing,
          },
          status: 'idle',
          score: engagement.score,
        };
      });

      setShorts(items);
      if (items.length > 0 && activeShortIndex >= items.length) setActiveShortIndex(0);

      // Persist to IndexedDB
      if (videoFile) {
        clientProjectStore.saveProject({
          id: `proj_${videoFile.name.replace(/[^\w]/g, '_')}`,
          title: videoFile.name.replace(/\.[^.]+$/, ''),
          sourceFilename: videoFile.name,
          sourceDuration: videoDuration,
          sourceWidth: videoWidth,
          sourceHeight: videoHeight,
          sourceFps: videoFps,
          fileSizeBytes: videoFile.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          selectedPlatform,
          targetAspectRatio: '9:16',
          reframeStrategy,
          selectedDuration: clipDuration,
          clippingMode: clippingMode === 'gaming-clipping' ? 'gaming-clipping' : 'ai-clipping',
          clips: items.map((it) => ({
            id: it.id,
            index: it.index,
            startTime: it.startTime,
            endTime: it.endTime,
            duration: it.duration,
            filename: it.filename,
            topic: it.topic,
            hookText: it.hook.text,
            score: it.score || 85,
          })),
        });
      }
    } catch (err) {
      console.error('Error generating clip plan:', err);
    }
  }, [videoDuration, clipDuration, clipCountTarget, clippingMode, gamingProfile, remainderStrategy, resolutionTier]);

  // ─── Upload Handler ────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(async (file: File) => {
    setVideoFile(file);
    setWorkerError(null);
    setSourceNotice(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Probe duration locally (HTML5 video element only — zero client audio decoding)
    const tempUrl = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = tempUrl;
    await new Promise<void>((res) => {
      vid.onloadedmetadata = () => {
        setVideoDuration(vid.duration || 120);
        setVideoWidth(vid.videoWidth || 1920);
        setVideoHeight(vid.videoHeight || 1080);
        URL.revokeObjectURL(tempUrl);
        res();
      };
      vid.onerror = () => { URL.revokeObjectURL(tempUrl); res(); };
      setTimeout(res, 3000);
    });

    // Upload to cloud worker via /api/upload proxy
    try {
      const form = new FormData();
      form.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });

      const result = await new Promise<UploadResult>((resolve, reject) => {
        xhr.open('POST', '/api/upload');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(form);
      });

      setUploadResult(result);
      setPhase('options');
    } catch (err: any) {
      setWorkerError(err?.message || 'Upload failed. The cloud worker may be unavailable.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ─── URL Import Handler ────────────────────────────────────────────────────

  const handleUrlImport = useCallback(async () => {
    const trimmed = urlImportValue.trim();
    if (!trimmed) return;
    setWorkerError(null);
    setSourceNotice(null);
    setIsUploading(true);

    try {
      const res = await fetch('/api/upload/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Specific handling for YouTube source terms restriction (HTTP 422)
        if (res.status === 422 && (data.code === 'YOUTUBE_DIRECT_STREAM_RESTRICTED' || data.provider === 'youtube')) {
          setSourceNotice({
            type: 'youtube',
            title: 'YouTube link import is not available',
            message:
              'PulseCut AI can preview supported YouTube links and save timestamps, but it cannot automatically extract and download arbitrary YouTube video streams. Upload your authorized original video file to create downloadable clips.',
            guidance:
              data.guidance ||
              'Use the embedded YouTube previewer to mark and save timestamp clips, or download the original file via YouTube Studio and upload it directly.',
            code: data.code,
            videoId: data.videoId,
            videoTitle: data.title,
            author: data.author,
            thumbnailUrl: data.thumbnailUrl,
            url: trimmed,
          });
          return;
        }

        // Generic 422 for other platforms (Twitch, Vimeo, etc.)
        if (res.status === 422) {
          setSourceNotice({
            type: data.provider || 'unsupported',
            title: `${data.provider ? data.provider.toUpperCase() : 'Source'} stream restricted`,
            message: data.message || 'Direct video downloading is restricted for this source.',
            guidance: data.guidance,
            code: data.code,
            url: trimmed,
          });
          return;
        }

        // 400 Bad Request
        if (res.status === 400) {
          setSourceNotice({
            type: 'error',
            title: 'Invalid video URL',
            message: data.error || data.message || 'Please provide a valid direct video URL or supported platform link.',
            url: trimmed,
          });
          return;
        }

        // 415 Unsupported Media
        if (res.status === 415) {
          setSourceNotice({
            type: 'unsupported',
            title: 'Unsupported video format',
            message: data.message || 'Only direct MP4, WebM, and MOV video URLs can be imported.',
            url: trimmed,
          });
          return;
        }

        // 503 Worker Unavailable
        if (res.status === 503) {
          setWorkerError('Cloud processing is temporarily unavailable. Please verify the media worker is reachable.');
          return;
        }

        // Fallback for unexpected errors
        setSourceNotice({
          type: 'error',
          title: 'Source import error',
          message: data.message || data.error || `Import failed with status ${res.status}.`,
          url: trimmed,
        });
        return;
      }

      // Successful import of direct media URL
      setUploadResult(data);
      setPhase('options');
    } catch (err: any) {
      setWorkerError(err?.message || 'Network error connecting to API. The service may be temporarily unreachable.');
    } finally {
      setIsUploading(false);
    }
  }, [urlImportValue]);

  // ─── Submit Job ────────────────────────────────────────────────────────────

  const submitJob = useCallback(async () => {
    if (!uploadResult) return;
    setWorkerError(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFilePath: uploadResult.filePath,
          projectId: crypto.randomUUID(),
          selectedDurationSeconds: clipDuration,
          reframeStrategy,
          subtitleThemeId,
          qualityTier,
          enable60Fps: true,
          enableCaptions: true,
          clippingMode,
          clipCountTarget,
          remainderStrategy,
          selectedPlatform,
        }),
      });
      const data = await res.json();
      if (data.jobId) {
        setActiveJobId(data.jobId);
        setPhase('processing');
        connectSSE(data.jobId);
      } else {
        setWorkerError(data.error || 'Failed to submit job. The cloud worker may be unavailable.');
      }
    } catch (err: any) {
      setWorkerError(err?.message || 'Cloud worker is currently unavailable. Please try again in a few minutes.');
    }
  }, [uploadResult, clipDuration, reframeStrategy, subtitleThemeId, qualityTier, clippingMode, clipCountTarget, remainderStrategy, selectedPlatform]);

  // ─── SSE Connection ────────────────────────────────────────────────────────

  const connectSSE = useCallback((jobId: string) => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }

    const es = new EventSource(`/api/jobs/${jobId}/events`);
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        setJobStatus(event.status || '');
        setJobStage(event.stage || '');
        setJobPercent(event.percent ?? 0);
        if (event.status === 'COMPLETED') {
          if (event.clips) setCompletedClips(event.clips);
          setPhase('results');
          es.close();
          sseRef.current = null;
        } else if (event.status === 'FAILED' || event.status === 'CANCELLED') {
          setWorkerError(event.error || `Job ${event.status.toLowerCase()}.`);
          es.close();
          sseRef.current = null;
        }
      } catch {}
    };

    es.onerror = () => {
      // Try to fetch final job state
      fetch(`/api/jobs/${jobId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === 'COMPLETED') {
            if (d.clips) setCompletedClips(d.clips);
            setPhase('results');
          } else if (d.status === 'FAILED' || d.status === 'CANCELLED') {
            setWorkerError(d.error || `Job ${d.status?.toLowerCase() || 'failed'}.`);
          }
        })
        .catch(() => setWorkerError('Lost connection to cloud worker. Your job may still be running.'));
      es.close();
      sseRef.current = null;
    };
  }, []);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => { sseRef.current?.close(); };
  }, []);

  // ─── Subtitle downloads ────────────────────────────────────────────────────

  const handleDownloadSubtitles = (format: 'srt' | 'vtt') => {
    const text = format === 'srt' ? exportToSrt(subtitles) : exportToVtt(subtitles);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `subtitles.${format}`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Rename ────────────────────────────────────────────────────────────────

  const handleRenameShort = (idx: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) { setEditingFilenameIdx(null); setEditingFilenameValue(''); return; }
    const final = trimmed.endsWith('.mp4') ? trimmed : `${trimmed}.mp4`;
    setShorts((prev) => prev.map((s, i) => (i === idx ? { ...s, filename: final } : s)));
    setEditingFilenameIdx(null); setEditingFilenameValue('');
  };

  // ─── Find Moments ──────────────────────────────────────────────────────────

  const handleMomentFound = (momentClip: CandidateClip) => {
    const newItem: ShortItem = {
      id: momentClip.id,
      index: shorts.length + 1,
      startTime: momentClip.startTime,
      endTime: momentClip.endTime,
      duration: momentClip.duration,
      filename: generateLocalShortFilename(momentClip.title, shorts.length + 1, momentClip.duration, resolutionTier, 60),
      topic: momentClip.title,
      hook: { id: `moment-hook-${Date.now()}`, category: 'Surprise', text: momentClip.suggestedHookText, suggestedDurationSeconds: 3.0 },
      engagement: {
        score: momentClip.score,
        rating: 'Exceptional',
        firstSecondsHook: momentClip.suggestedHookText,
        deadAirRatio: 'Low (< 5%)',
        captionReadability: 'High',
        speechClarity: 'Clear',
        pacingNote: 'Matched from natural language search.',
      },
      status: 'idle',
      score: momentClip.score,
      explanation: momentClip.explanation,
    };
    setShorts((prev) => [newItem, ...prev]);
    setActiveShortIndex(0);
  };

  // ─── Reset to start ────────────────────────────────────────────────────────

  const resetStudio = () => {
    sseRef.current?.close();
    sseRef.current = null;
    setPhase('source');
    setUploadResult(null);
    setActiveJobId(null);
    setCompletedClips([]);
    setWorkerError(null);
    setJobStatus('');
    setJobStage('');
    setJobPercent(0);
    setVideoFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUrlImportValue('');
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">

      {/* Cloud Processing Banner */}
      <div className="bg-sky-950/60 border-b border-sky-500/20 px-4 py-2 text-center text-xs sm:text-sm text-sky-300 flex items-center justify-center gap-2">
        <Cloud className="h-4 w-4 text-sky-400 shrink-0" />
        <span>
          <strong>Cloud-accelerated processing</strong> — videos are rendered server-side with GPU hardware encoders. No local CPU load.
        </span>
      </div>

      {/* Source Notice Banner (e.g. YouTube Terms & Guidance) */}
      {sourceNotice && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              {sourceNotice.type === 'youtube' ? <Tv className="h-5 w-5 text-red-400" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-bold text-amber-200">{sourceNotice.title}</p>
              <p className="text-xs text-amber-300/90 mt-0.5 max-w-3xl leading-relaxed">
                {sourceNotice.message}
              </p>
              {sourceNotice.guidance && (
                <p className="text-[11px] text-slate-300 mt-1 italic">
                  💡 {sourceNotice.guidance}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {sourceNotice.type === 'youtube' && sourceNotice.videoId && (
              <button
                onClick={() => {
                  setYoutubePreviewId(sourceNotice.videoId!);
                  setYoutubeMetadata({
                    title: sourceNotice.videoTitle,
                    author: sourceNotice.author,
                    url: sourceNotice.url,
                  });
                  setSourceTab('url');
                  setSourceNotice(null);
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/20"
              >
                <Tv className="h-3.5 w-3.5" />
                <span>Preview &amp; Save Timestamps</span>
              </button>
            )}
            <button
              onClick={() => {
                setSourceTab('upload');
                setSourceNotice(null);
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-all"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Original File</span>
            </button>
            <button
              onClick={() => setSourceNotice(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Cloud Worker Unavailable Error Banner */}
      {workerError && (
        <div className="bg-red-950/70 border-b border-red-500/40 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <ServerCrash className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-200">Cloud processing is temporarily unavailable.</p>
              <p className="text-xs text-red-300 mt-0.5">
                {workerError} Your video has NOT been processed on your device.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {phase === 'processing' && activeJobId && (
              <button
                onClick={() => connectSSE(activeJobId)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reconnect
              </button>
            )}
            {(phase === 'source' || phase === 'options') && (
              <button
                onClick={phase === 'options' ? submitJob : undefined}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
            <button
              onClick={() => setWorkerError(null)}
              className="text-xs text-slate-400 hover:text-white px-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Header & Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                PulseCut AI 2.5
              </span>
              <span className="text-xs text-slate-400">• By Code With Bitwizards</span>
              <span className="rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider">Cloud</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Intelligent AI Clipping Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Cloud upload → GPU rendering → instant download. GTA VI gaming detection, 12 kinetic subtitle themes, 60 FPS.
            </p>
          </div>

          {/* Engine Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setClippingMode('ai-clipping')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                clippingMode === 'ai-clipping'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>AI Clipping</span>
            </button>

            <button
              onClick={() => setClippingMode('gaming-clipping')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                clippingMode === 'gaming-clipping'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-4 w-4 text-amber-300" />
              <span>GTA VI Gaming</span>
            </button>

            <button
              onClick={() => setIsFindMomentsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 transition-all"
            >
              <Search className="h-4 w-4 text-purple-400" />
              <span>Find Moments</span>
            </button>
          </div>
        </div>

        {/* ── PHASE INDICATOR ── */}
        <div className="flex items-center gap-1 text-xs font-semibold">
          {(['source', 'options', 'processing', 'results'] as StudioPhase[]).map((p, i) => {
            const labels: Record<StudioPhase, string> = { source: '1. Source', options: '2. Options', processing: '3. Processing', results: '4. Results' };
            const done = ['source', 'options', 'processing', 'results'].indexOf(phase) > i;
            const active = phase === p;
            return (
              <React.Fragment key={p}>
                <span className={`px-2.5 py-1 rounded-lg transition-all ${active ? 'bg-cyan-500 text-slate-950' : done ? 'bg-slate-800 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                  {done && <CircleCheck className="inline h-3 w-3 mr-1" />}
                  {labels[p]}
                </span>
                {i < 3 && <ChevronRight className="h-3 w-3 text-slate-700" />}
              </React.Fragment>
            );
          })}
          {phase !== 'source' && (
            <button onClick={resetStudio} className="ml-auto text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-1 transition-colors">
              <RotateCcw className="h-3 w-3" /> Start over
            </button>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            PHASE 1: SOURCE SELECTION
            ════════════════════════════════════════════════════════════════ */}
        {phase === 'source' && (
          <div className="space-y-6">
            {/* Tab switcher */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
              <button
                onClick={() => setSourceTab('upload')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                  sourceTab === 'upload'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload File
              </button>
              <button
                onClick={() => setSourceTab('url')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                  sourceTab === 'url'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Link2 className="h-4 w-4" />
                Import from URL
              </button>
            </div>

            {sourceTab === 'upload' ? (
              <div className="space-y-4">
                {/* Upload area — wired to cloud */}
                {isUploading ? (
                  <div className="border-2 border-dashed border-cyan-500/40 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-900/50">
                    <Cloud className="h-12 w-12 text-cyan-400 animate-pulse" />
                    <div className="text-center">
                      <p className="font-semibold text-white">Uploading to cloud…</p>
                      <p className="text-xs text-slate-400 mt-1">{videoFile?.name}</p>
                    </div>
                    <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-cyan-400 font-mono">{uploadProgress}%</span>
                  </div>
                ) : (
                  <DualSourceDropzone
                    onVideoSelected={handleFileSelected}
                  />
                )}
              </div>
            ) : youtubePreviewId ? (
              <YouTubeTimestampStudio
                videoId={youtubePreviewId}
                initialTitle={youtubeMetadata?.title}
                author={youtubeMetadata?.author}
                url={youtubeMetadata?.url || `https://www.youtube.com/watch?v=${youtubePreviewId}`}
                onUploadOriginal={() => {
                  setYoutubePreviewId(null);
                  setSourceTab('upload');
                }}
                onChangeUrl={() => {
                  setYoutubePreviewId(null);
                  setUrlImportValue('');
                }}
              />
            ) : (
              /* URL Import */
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <Link2 className="h-5 w-5 text-cyan-400" />
                  Import Video from URL
                </div>
                <p className="text-xs text-slate-400">
                  Paste a direct video URL (MP4, MOV, etc.) or a supported platform link. The cloud worker will fetch and process it.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlImportValue}
                    onChange={(e) => setUrlImportValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={handleUrlImport}
                    disabled={isUploading || !urlImportValue.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all"
                  >
                    {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Import
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PHASE 2: JOB OPTIONS
            ════════════════════════════════════════════════════════════════ */}
        {phase === 'options' && uploadResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT: Controls */}
            <div className="lg:col-span-4 space-y-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">

              {/* Source info */}
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                  <Cloud className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate">{videoFile?.name ?? 'Remote video'}</p>
                  <p className="text-[11px] text-slate-400">{uploadResult.filePath.split(/[\\/]/).pop()}</p>
                </div>
                <button onClick={resetStudio} className="ml-auto text-slate-500 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Clipping mode banner */}
              {clippingMode === 'gaming-clipping' ? (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Gamepad2 className="h-4 w-4 text-purple-400" />
                      Gaming Profile
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono">HUD Safe</span>
                  </div>
                  <select
                    value={gamingProfile}
                    onChange={(e) => setGamingProfile(e.target.value as GamingProfile)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="GTA VI Gameplay">GTA VI Gameplay (Auto Radar Safe)</option>
                    <option value="Open-World Gaming">Open-World Action & Stunts</option>
                    <option value="FPS Gaming">FPS Gaming (Crosshair Lock)</option>
                    <option value="Gaming Commentary">Gaming Commentary & Dialogue</option>
                    <option value="Gaming Reactions">Gaming Reactions (Scream / Hype)</option>
                    <option value="General Gaming">General Gaming</option>
                  </select>
                </div>
              ) : (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Acoustic Energy & Boundary Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Snaps clip boundaries to natural speech pauses and ranks candidate moments by hook and visual interest.
                  </p>
                </div>
              )}

              {/* Clip Duration */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Clip Duration: <span className="text-cyan-400">{clipDuration}s</span>
                  </label>
                  <span className="text-xs text-slate-500 font-mono">{shorts.length} Shorts planned</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 30, 45, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setClipDuration(d)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        clipDuration === d
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">Target Clip Count:</span>
                  <div className="flex items-center gap-1">
                    {[3, 5, 8, 12].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setClipCountTarget(cnt)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          clipCountTarget === cnt
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platform Preset */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Target Platform Preset
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as PlatformId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-semibold"
                >
                  <option value="universal">Universal 9:16 (All Platforms)</option>
                  <option value="youtube-shorts">YouTube Shorts (Safe Zones)</option>
                  <option value="tiktok">TikTok (Safe Zones)</option>
                  <option value="instagram-reels">Instagram Reels (Safe Zones)</option>
                  <option value="facebook-reels">Facebook Reels</option>
                  <option value="x">X / Twitter Video</option>
                  <option value="threads">Threads Video</option>
                </select>
              </div>

              {/* Reframing & Editing Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Reframing (9:16)
                  </label>
                  <select
                    value={reframeStrategy}
                    onChange={(e) => setReframeStrategy(e.target.value as ReframeStrategy)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="AI Smart">AI Smart Pan</option>
                    <option value="Gameplay">Gameplay (HUD Safe)</option>
                    <option value="Face Focus">Face Focus</option>
                    <option value="Center">Center Crop</option>
                    <option value="Fit + Blur">Fit + Blur BG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Editing Style
                  </label>
                  <select
                    value={editingStyle}
                    onChange={(e) => setEditingStyle(e.target.value as EditingStyle)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="Clean">Clean (Subtle)</option>
                    <option value="Balanced">Balanced (Punch)</option>
                    <option value="High Energy">High Energy</option>
                    <option value="Extreme">Extreme Cuts</option>
                  </select>
                </div>
              </div>

              {/* Subtitle Theme */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Subtitle Typography Theme
                </label>
                <select
                  value={subtitleThemeId}
                  onChange={(e) => setSubtitleThemeId(e.target.value as SubtitleThemeId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-semibold"
                >
                  {Object.values(SUBTITLE_THEMES).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Export Quality */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Export Quality (60 FPS)
                  </label>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {targetDims.width}×{targetDims.height} @ 60 FPS
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['1080p', '2k', '4k'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setResolutionTier(tier)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                        resolutionTier === tier
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tier.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Tier */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Processing Quality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'high', 'max'] as const).map((qt) => (
                    <button
                      key={qt}
                      onClick={() => setQualityTier(qt)}
                      className={`py-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                        qualityTier === qt
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {qt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Clip Plan Preview + Submit */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Planned Clips ({shorts.length})
                  </h3>
                  <p className="text-xs text-slate-500">Heuristic preview — cloud AI may adjust boundaries</p>
                </div>
                <button
                  onClick={submitJob}
                  disabled={!uploadResult}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Cloud className="h-4 w-4" />
                  Submit to Cloud
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Clip Plan Cards */}
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {shorts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                    <Scissors className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Adjust options on the left to generate clip plan</p>
                  </div>
                ) : shorts.map((short, idx) => {
                  const isActive = activeShortIndex === idx;
                  return (
                    <div
                      key={short.id}
                      onClick={() => setActiveShortIndex(idx)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">
                              Short #{String(short.index).padStart(2, '0')}
                            </span>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                              {short.duration}s
                            </span>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                              9:16 • 60 FPS
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                            ⚡ {short.hook.text}
                          </div>
                          {short.explanation && (
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{short.explanation}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                          <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-0.5">
                            <Flame className="h-3 w-3 text-emerald-400" />
                            {short.score || short.engagement.score}/100
                          </span>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                          {editingFilenameIdx === idx ? (
                            <input
                              autoFocus
                              value={editingFilenameValue}
                              onChange={(e) => setEditingFilenameValue(e.target.value)}
                              onBlur={() => handleRenameShort(idx, editingFilenameValue)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameShort(idx, editingFilenameValue); if (e.key === 'Escape') { setEditingFilenameIdx(null); setEditingFilenameValue(''); } }}
                              className="bg-slate-800 border border-cyan-500/40 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none w-48"
                            />
                          ) : (
                            <span
                              className="text-[11px] text-slate-400 font-mono truncate cursor-pointer hover:text-slate-200 transition-colors"
                              onClick={() => { setEditingFilenameIdx(idx); setEditingFilenameValue(short.filename); }}
                              title={short.filename}
                            >
                              {short.filename}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingClipIndex(idx); }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit clip boundaries"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {short.startTime.toFixed(1)}s – {short.endTime.toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit button bottom */}
              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span className="text-slate-300 font-semibold">{shorts.length} clips</span> • {resolutionTier.toUpperCase()} • {reframeStrategy} • {subtitleThemeId} captions
                </div>
                <button
                  onClick={submitJob}
                  disabled={!uploadResult}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Cloud className="h-4 w-4" />
                  Submit to Cloud
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PHASE 3: PROCESSING / JOB MONITOR
            ════════════════════════════════════════════════════════════════ */}
        {phase === 'processing' && activeJobId && (
          <div className="max-w-2xl mx-auto space-y-6 py-8">
            {/* Job ID */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-full px-4 py-1.5 text-xs font-mono text-sky-300">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                Job ID: {activeJobId}
              </div>
            </div>

            {/* Progress card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-sky-400 animate-pulse" />
                  <span className="font-bold text-white">Cloud Processing</span>
                </div>
                <span className="text-xs font-mono text-cyan-400">{jobPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 rounded-full"
                  style={{ width: `${jobPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 rounded-xl p-3 space-y-1">
                  <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Status</span>
                  <p className="text-slate-100 font-semibold">{jobStatus || 'Queued'}</p>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 space-y-1">
                  <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Stage</span>
                  <p className="text-slate-100 font-semibold">{jobStage || 'Waiting for worker…'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                <span>GPU hardware encoder active</span>
                <button
                  onClick={() => connectSSE(activeJobId)}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reconnect
                </button>
              </div>
            </div>

            {/* What's happening */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Cloud Pipeline</p>
              {[
                ['Transcription', 'Whisper ASR → subtitle cues generation'],
                ['Scene detection', 'AI highlight scoring & boundary snapping'],
                ['Reframing', `${reframeStrategy} 9:16 crop with motion tracking`],
                ['Encoding', `H.264/NVENC 60 FPS ${resolutionTier.toUpperCase()} MP4`],
                ['Caption burn-in', `${subtitleThemeId} kinetic subtitle theme`],
              ].map(([step, desc]) => (
                <div key={step} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                  <span><strong className="text-slate-300">{step}</strong> — {desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PHASE 4: RESULTS
            ════════════════════════════════════════════════════════════════ */}
        {phase === 'results' && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl p-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-200">Processing complete!</p>
                <p className="text-xs text-emerald-400">{completedClips.length} clips ready • Job {activeJobId}</p>
              </div>
              <button onClick={resetStudio} className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all">
                <RotateCcw className="h-3.5 w-3.5" />
                New video
              </button>
            </div>

            {/* Clip result cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {completedClips.map((clip, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors"
                >
                  {/* Thumbnail placeholder */}
                  <div className="relative bg-slate-800 aspect-[9/16] max-h-64 w-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="h-14 w-14 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center border border-slate-700 shadow-xl">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </div>
                    {/* Duration badge */}
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-mono px-1.5 py-0.5 rounded">
                      {clip.duration?.toFixed(1) ?? '?'}s
                    </span>
                    {/* Engagement badge */}
                    <span className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Flame className="h-3 w-3" />
                      {clip.engagementPotential ?? '—'}/100
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-bold text-sm text-white line-clamp-1">
                        Clip #{(clip.clipIndex ?? idx) + 1} — {clip.mainTopic}
                      </p>
                      {clip.selectedHook?.text && (
                        <p className="text-xs text-cyan-300 mt-0.5 line-clamp-2">⚡ {clip.selectedHook.text}</p>
                      )}
                      <p className="text-[11px] text-slate-500 font-mono mt-1">
                        {clip.startTime?.toFixed(1)}s – {clip.endTime?.toFixed(1)}s
                      </p>
                    </div>

                    {/* Downloads */}
                    <div className="space-y-2">
                      {clip.mp4File && (
                        <a
                          href={`/api/downloads/${clip.mp4File}`}
                          download
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold transition-all"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download MP4
                        </a>
                      )}

                      <div className="flex gap-1.5">
                        {clip.srtFile && (
                          <a
                            href={`/api/downloads/${clip.srtFile}`}
                            download
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all"
                          >
                            <FileText className="h-3 w-3" />
                            .SRT
                          </a>
                        )}
                        {clip.vttFile && (
                          <a
                            href={`/api/downloads/${clip.vttFile}`}
                            download
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all"
                          >
                            <FileText className="h-3 w-3" />
                            .VTT
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Filename */}
                    <p className="text-[10px] text-slate-600 font-mono truncate" title={clip.cleanFilename}>
                      {clip.cleanFilename}
                    </p>
                  </div>
                </div>
              ))}

              {completedClips.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
                  <Cloud className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No clips were returned by the cloud worker.</p>
                  <button onClick={resetStudio} className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    Try again
                  </button>
                </div>
              )}
            </div>

            {/* Subtitle downloads (from last active short's cues) */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Synchronized Captions (Preview)</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleDownloadSubtitles('srt')}
                    className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                  >
                    .SRT
                  </button>
                  <button
                    onClick={() => handleDownloadSubtitles('vtt')}
                    className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                  >
                    .VTT
                  </button>
                </div>
              </div>
              <p className="text-slate-400 italic line-clamp-2 text-[11px]">
                "{subtitles.map((c) => c.text).join(' ')}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Find Moments Modal */}
      <FindMomentsModal
        isOpen={isFindMomentsOpen}
        onClose={() => setIsFindMomentsOpen(false)}
        videoDuration={videoDuration}
        subtitles={subtitles}
        audioPeakTimes={[]}
        onSelectMoment={handleMomentFound}
      />

      {/* Clip Editor Modal */}
      {editingClipIndex !== null && shorts[editingClipIndex] && (
        <ClipEditorModal
          clip={{
            id: shorts[editingClipIndex].id,
            projectId: uploadResult?.jobId || 'cloud',
            clipIndex: shorts[editingClipIndex].index,
            startTime: shorts[editingClipIndex].startTime,
            endTime: shorts[editingClipIndex].endTime,
            duration: shorts[editingClipIndex].duration,
            status: 'READY',
            mainTopic: shorts[editingClipIndex].topic,
            summary: shorts[editingClipIndex].explanation || '',
            engagementPotential: shorts[editingClipIndex].score || 85,
            engagementRationale: '',
            selectedHook: {
              id: shorts[editingClipIndex].hook.id,
              type: 'curiosity',
              text: shorts[editingClipIndex].hook.text,
              rationale: '',
            },
            alternativeHooks: [],
            transcriptSegments: [],
            subtitleThemeId: subtitleThemeId,
            reframeStrategy: reframeStrategy,
            cropTimeline: [],
            socialMetadata: {} as any,
            cleanFilename: shorts[editingClipIndex].filename,
            detailedFilename: shorts[editingClipIndex].filename,
            renders: {},
          }}
          maxSourceDuration={videoDuration}
          onClose={() => setEditingClipIndex(null)}
          onSave={(updated) => {
            setShorts((prev) =>
              prev.map((s, i) =>
                i === editingClipIndex
                  ? {
                      ...s,
                      startTime: updated.startTime,
                      endTime: updated.endTime,
                      duration: updated.duration,
                      hook: { ...s.hook, text: updated.selectedHook?.text || s.hook.text },
                    }
                  : s
              )
            );
            setEditingClipIndex(null);
          }}
        />
      )}
    </div>
  );
}
