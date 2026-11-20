'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Upload,
  Video,
  Sparkles,
  Sliders,
  Play,
  Pause,
  Download,
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Settings,
  Flame,
  Clock,
  HardDrive,
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
} from 'lucide-react';
import { calculateClips, RemainderStrategy } from '@shorts/shared';
import { PLATFORM_PRESETS, PlatformId } from '@shorts/platform-presets';
import {
  detectDeviceCapabilities,
  DeviceCapabilities,
} from '@/lib/deviceDetector';
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
import {
  renderShortToMp4,
  renderFrameToCanvas,
  clearAudioCache,
  ReframeStrategy,
  EditingStyle,
  RenderResult,
} from '@/lib/videoEngine';
import { APP_CONFIG } from '@/config/app';
import { DualSourceDropzone } from '@/features/ingestion/components/DualSourceDropzone';
import { detectCandidateHighlights, CandidateClip } from '@/lib/highlightDetector';
import {
  generateGamingHighlights,
  GamingProfile,
} from '@/lib/gamingClipper';
import { FindMomentsModal } from '@/components/FindMomentsModal';
import { ClipEditorModal } from '@/components/ClipEditorModal';
import { clientProjectStore, ClientProject } from '@/lib/indexedDBStore';
import { transcribeVideoAudio, isBrowserSpeechRecognitionSupported } from '@/lib/speechEngine';

export type ClippingEngineMode = 'ai-clipping' | 'gaming-clipping' | 'find-moments' | 'math-split';

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
  status: 'idle' | 'rendering' | 'ready' | 'error';
  renderProgress?: number;
  stageText?: string;
  outputBlob?: Blob;
  outputUrl?: string;
  streamedToDisk?: boolean;
  score?: number;
  explanation?: string;
}

export default function StudioPage() {
  // Device Capabilities State
  const [deviceCaps, setDeviceCaps] = useState<DeviceCapabilities | null>(null);
  const [detectingCaps, setDetectingCaps] = useState(true);

  // Video Source State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoWidth, setVideoWidth] = useState<number>(1920);
  const [videoHeight, setVideoHeight] = useState<number>(1080);
  const [videoFps, setVideoFps] = useState<number>(30);
  const [copyrightConfirmed, setCopyrightConfirmed] = useState(true);

  // Clipping Engine Mode
  const [clippingMode, setClippingMode] = useState<ClippingEngineMode>('ai-clipping');
  const [gamingProfile, setGamingProfile] = useState<GamingProfile>('GTA VI Gameplay');

  // Configuration State
  const [clipDuration, setClipDuration] = useState<number>(30);
  const [clipCountTarget, setClipCountTarget] = useState<number>(5);
  const [remainderStrategy, setRemainderStrategy] = useState<RemainderStrategy>('ignore');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('universal');
  const [reframeStrategy, setReframeStrategy] = useState<ReframeStrategy>('AI Smart');
  const [editingStyle, setEditingStyle] = useState<EditingStyle>('Balanced');
  const [resolutionTier, setResolutionTier] = useState<'1080p' | '2k' | '4k'>('1080p');
  const [subtitleThemeId, setSubtitleThemeId] = useState<SubtitleThemeId>('creator');
  const [showSafeZones, setShowSafeZones] = useState(true);

  // Subtitles / Cues
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([
    { id: 'c1', startTime: 0, endTime: 3.2, text: 'This secret changes everything about creating shorts.' },
    { id: 'c2', startTime: 3.2, endTime: 7.0, text: 'You no longer need expensive cloud servers or subscriptions.' },
    { id: 'c3', startTime: 7.0, endTime: 12.0, text: 'Everything runs 100% directly in your browser with WebCodecs.' },
    { id: 'c4', startTime: 12.0, endTime: 18.0, text: 'Your video never leaves your computer, ensuring absolute privacy.' },
  ]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Audio Analysis State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioPeakTimes, setAudioPeakTimes] = useState<number[]>([]);

  // Generated Shorts Plan
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [activeShortIndex, setActiveShortIndex] = useState<number>(0);

  // Interactive Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Modals & Editors
  const [isFindMomentsOpen, setIsFindMomentsOpen] = useState(false);
  const [editingClipIndex, setEditingClipIndex] = useState<number | null>(null);

  // Global rendering state
  const [isBatchRendering, setIsBatchRendering] = useState(false);
  const isBatchRenderingRef = useRef(false);

  // Inline filename renaming state
  const [editingFilenameIdx, setEditingFilenameIdx] = useState<number | null>(null);
  const [editingFilenameValue, setEditingFilenameValue] = useState('');

  // 1. Initial Device Capability Detection
  useEffect(() => {
    async function initDetector() {
      setDetectingCaps(true);
      try {
        const caps = await detectDeviceCapabilities();
        setDeviceCaps(caps);
      } catch (err) {
        console.error('Capability detection error:', err);
      } finally {
        setDetectingCaps(false);
      }
    }
    initDetector();
  }, []);

  // 2. Handle Video File Selection (from Local or Direct URL Ingestion)
  const loadVideoFile = (file: File) => {
    clearAudioCache();
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setIsPlaying(false);
    setCurrentTime(0);

    // Decode audio in browser AudioContext for acoustic highlight detection
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    file
      .arrayBuffer()
      .then((ab) => audioCtx.decodeAudioData(ab))
      .then((decoded) => {
        setAudioBuffer(decoded);
        // Compute top audio peaks
        const chData = decoded.getChannelData(0);
        const peaks: number[] = [];
        const win = Math.floor(decoded.sampleRate * 0.5);
        for (let i = 0; i < chData.length; i += win) {
          let sum = 0;
          for (let j = 0; j < win; j += 4) {
            const v = chData[i + j] || 0;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / (win / 4));
          if (rms > 0.6) {
            peaks.push(Math.round((i / decoded.sampleRate) * 10) / 10);
          }
        }
        setAudioPeakTimes(peaks);
      })
      .catch((e) => {
        console.warn('Could not pre-decode audio for highlight detection (video may lack audio):', e);
      });
  };

  // 3. When Video Metadata Loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      const w = videoRef.current.videoWidth || 1920;
      const h = videoRef.current.videoHeight || 1080;
      setVideoDuration(dur);
      setVideoWidth(w);
      setVideoHeight(h);
      setVideoFps(30);
    }
  };

  // 4. Intelligent Highlights Generation (AI, Gaming, or Math Split)
  useEffect(() => {
    if (videoDuration <= 0) return;

    try {
      let items: ShortItem[] = [];

      if (clippingMode === 'gaming-clipping') {
        // Dedicated Gaming Engine (GTA VI, FPS, Reactions)
        const candidates = generateGamingHighlights({
          videoDuration,
          profile: gamingProfile,
          targetDuration: clipDuration,
          clipCount: clipCountTarget,
          audioBuffer: audioBuffer || undefined,
        });

        items = candidates.map((c, i) => ({
          id: `gaming-${i + 1}`,
          index: i + 1,
          startTime: c.startTime,
          endTime: c.endTime,
          duration: c.duration,
          filename: generateLocalShortFilename(c.title, i + 1, c.duration, resolutionTier, 60),
          topic: c.title,
          hook: {
            id: `hook-g-${i}`,
            category: 'Surprise',
            text: c.suggestedHookText,
            suggestedDurationSeconds: 3.0,
          },
          engagement: {
            score: c.score,
            rating: c.score > 85 ? 'Exceptional' : 'Strong',
            firstSecondsHook: c.suggestedHookText,
            deadAirRatio: 'Low (< 4%)',
            captionReadability: 'High',
            speechClarity: 'Clear',
            pacingNote: `${gamingProfile} action burst detected.`,
          },
          status: 'idle',
          score: c.score,
          explanation: c.explanation,
        }));
      } else if (clippingMode === 'ai-clipping') {
        // Acoustic & Highlight Engine
        const candidates = detectCandidateHighlights({
          videoDuration,
          targetDuration: clipDuration,
          clipCount: clipCountTarget,
          audioBuffer: audioBuffer || undefined,
        });

        items = candidates.map((c, i) => ({
          id: `ai-${i + 1}`,
          index: i + 1,
          startTime: c.startTime,
          endTime: c.endTime,
          duration: c.duration,
          filename: generateLocalShortFilename(c.title, i + 1, c.duration, resolutionTier, 60),
          topic: c.title,
          hook: {
            id: `hook-${i}`,
            category: 'Curiosity',
            text: c.suggestedHookText,
            suggestedDurationSeconds: 3.0,
          },
          engagement: {
            score: c.score,
            rating: c.score > 85 ? 'Exceptional' : 'Strong',
            firstSecondsHook: c.suggestedHookText,
            deadAirRatio: 'Optimal (< 8%)',
            captionReadability: 'High',
            speechClarity: 'Clear',
            pacingNote: 'Sentence pause boundary alignment applied.',
          },
          status: 'idle',
          score: c.score,
          explanation: c.explanation,
        }));
      } else {
        // Fallback: Exact mathematical interval splitter
        const result = calculateClips(videoDuration, clipDuration, remainderStrategy);
        items = result.clips.map((clip) => {
          const dummyTranscript = `Clip ${clip.index}: Key takeaways from ${clip.startTime}s to ${clip.endTime}s.`;
          const hooks = generateHooks(dummyTranscript, `Part ${clip.index}`);
          const primaryHook = hooks[0];
          const engagement = evaluateEngagementPotential(dummyTranscript, clip.duration, true);
          const filename = generateLocalShortFilename(dummyTranscript, clip.index, clip.duration, resolutionTier, 60);

          return {
            id: `short-${clip.index}`,
            index: clip.index,
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: clip.duration,
            filename,
            topic: `Segment #${clip.index}`,
            hook: primaryHook,
            engagement,
            status: 'idle',
            score: engagement.score,
          };
        });
      }

      setShorts(items);
      if (items.length > 0 && activeShortIndex >= items.length) {
        setActiveShortIndex(0);
      }

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
      console.error('Error generating clips:', err);
    }
  }, [
    videoDuration,
    clipDuration,
    clipCountTarget,
    clippingMode,
    gamingProfile,
    remainderStrategy,
    resolutionTier,
    audioBuffer,
  ]);

  // 5. Realtime Interactive Preview Canvas Loop
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const isExporting = isBatchRenderingRef.current || shorts.some((s) => s.status === 'rendering');
      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      if (!isExporting && video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const activeShort = shorts[activeShortIndex];
          const hook = activeShort ? activeShort.hook : undefined;
          const clipStart = activeShort ? activeShort.startTime : 0;
          const theme = SUBTITLE_THEMES[subtitleThemeId];

          renderFrameToCanvas(
            ctx,
            video,
            canvas.width,
            canvas.height,
            reframeStrategy,
            editingStyle,
            video.currentTime,
            clipStart,
            subtitles,
            theme,
            hook
          );
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [reframeStrategy, editingStyle, subtitleThemeId, subtitles, activeShortIndex, shorts]);

  // Video Play / Pause control with audio playback
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.muted = isMuted;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Audio playback restricted by browser policy:', err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
          }
        });
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const activeShort = shorts[activeShortIndex];
      if (activeShort && videoRef.current.currentTime >= activeShort.endTime) {
        videoRef.current.currentTime = activeShort.startTime;
      }
    }
  };

  const jumpToShort = (index: number) => {
    setActiveShortIndex(index);
    const short = shorts[index];
    if (short && videoRef.current) {
      videoRef.current.currentTime = short.startTime;
      setCurrentTime(short.startTime);
    }
  };

  // Dimensions based on resolution tier
  const targetDims = useMemo(() => {
    switch (resolutionTier) {
      case '4k':
        return { width: 2160, height: 3840, bitrate: 35_000_000 };
      case '2k':
        return { width: 1440, height: 2560, bitrate: 18_000_000 };
      case '1080p':
      default:
        return { width: 1080, height: 1920, bitrate: 10_000_000 };
    }
  }, [resolutionTier]);

  // 6. Speech-to-Text Transcription Trigger
  const handleGenerateCaptions = async () => {
    if (!videoRef.current) return;
    setIsTranscribing(true);
    try {
      const cues = await transcribeVideoAudio(videoRef.current);
      setSubtitles(cues);
    } catch (e) {
      console.warn('Transcription error:', e);
    } finally {
      setIsTranscribing(false);
    }
  };

  // 7. Render Single Short to MP4 with WebCodecs
  const handleRenderShort = async (shortIndex: number, isBatchMode = false) => {
    const short = shorts[shortIndex];
    if (!short || !videoRef.current) return;

    if (!isBatchMode && resolutionTier === '4k' && deviceCaps && !deviceCaps.encode4k60.supported) {
      const proceed = confirm(
        '4K rendering may exceed this device\'s browser/GPU capability. 1080p is recommended. Continue?'
      );
      if (!proceed) return;
    }

    setShorts((prev) =>
      prev.map((s, idx) =>
        idx === shortIndex ? { ...s, status: 'rendering', renderProgress: 0, stageText: 'Starting hardware encoder...' } : s
      )
    );

    let fileHandle: FileSystemFileHandle | undefined = undefined;
    if (!isBatchMode && typeof window !== 'undefined' && (window as any).showSaveFilePicker) {
      try {
        const useStreaming = confirm(
          `Stream "${short.filename}" directly to your disk to save memory?`
        );
        if (useStreaming) {
          fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: short.filename,
            types: [{ description: 'MP4 Video', accept: { 'video/mp4': ['.mp4'] } }],
          });
        }
      } catch {
        // Fallback to in-memory Blob
      }
    }

    try {
      const theme = SUBTITLE_THEMES[subtitleThemeId];
      const devicePerf = (() => {
        switch (deviceCaps?.performanceLevel) {
          case 'Excellent': return 'excellent' as const;
          case 'Good':      return 'good' as const;
          case 'Limited':   return 'limited' as const;
          default:          return 'compat' as const;
        }
      })();

      const result: RenderResult = await renderShortToMp4({
        sourceVideo: videoRef.current,
        sourceFile: videoFile || undefined,
        startTime: short.startTime,
        endTime: short.endTime,
        targetWidth: targetDims.width,
        targetHeight: targetDims.height,
        targetFps: 60,
        bitrate: targetDims.bitrate,
        reframeStrategy,
        editingStyle,
        subtitles,
        subtitleTheme: theme,
        hook: short.hook,
        fileHandle,
        devicePerf,
        onProgress: (pct, stage) => {
          setShorts((prev) =>
            prev.map((s, idx) =>
              idx === shortIndex ? { ...s, renderProgress: pct, stageText: stage } : s
            )
          );
        },
      });

      const outputUrl = result.blob ? URL.createObjectURL(result.blob) : undefined;

      setShorts((prev) =>
        prev.map((s, idx) =>
          idx === shortIndex
            ? {
                ...s,
                status: 'ready',
                renderProgress: 100,
                stageText: 'Ready to download',
                outputBlob: result.blob,
                outputUrl,
                streamedToDisk: result.streamedToDisk,
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('Render error:', err);
      setShorts((prev) =>
        prev.map((s, idx) =>
          idx === shortIndex
            ? { ...s, status: 'error', stageText: err?.message || 'Rendering failed.' }
            : s
        )
      );
    }
  };

  // 8. Batch Render All Shorts Sequentially
  const handleRenderAll = async () => {
    if (isBatchRendering || shorts.length === 0) return;

    if (resolutionTier === '4k' && deviceCaps && !deviceCaps.encode4k60.supported) {
      const proceed = confirm(
        '4K batch rendering may exceed this device\'s GPU limits. 1080p is recommended. Continue?'
      );
      if (!proceed) return;
    }

    isBatchRenderingRef.current = true;
    setIsBatchRendering(true);

    try {
      for (let i = 0; i < shorts.length; i++) {
        await handleRenderShort(i, true);
      }
    } finally {
      isBatchRenderingRef.current = false;
      setIsBatchRendering(false);
    }
  };

  // 9. Rename Short Filename
  const handleRenameShort = (idx: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setEditingFilenameIdx(null);
      setEditingFilenameValue('');
      return;
    }
    const final = trimmed.endsWith('.mp4') ? trimmed : `${trimmed}.mp4`;
    setShorts((prev) => prev.map((s, i) => (i === idx ? { ...s, filename: final } : s)));
    setEditingFilenameIdx(null);
    setEditingFilenameValue('');
  };

  // 10. Download Rendered MP4
  const handleDownload = (short: ShortItem) => {
    if (short.outputUrl) {
      const a = document.createElement('a');
      a.href = short.outputUrl;
      a.download = short.filename;
      a.click();
    }
  };

  // 11. Download Subtitles
  const handleDownloadSubtitles = (format: 'srt' | 'vtt') => {
    const text = format === 'srt' ? exportToSrt(subtitles) : exportToVtt(subtitles);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 12. Clear Temporary Buffers
  const handleClearTemporaryFiles = () => {
    shorts.forEach((s) => {
      if (s.outputUrl) URL.revokeObjectURL(s.outputUrl);
    });
    setShorts((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'idle',
        outputBlob: undefined,
        outputUrl: undefined,
      }))
    );
    alert('Temporary browser video buffers released.');
  };

  // Handle Find Moments Selection
  const handleMomentFound = (momentClip: CandidateClip) => {
    const newItem: ShortItem = {
      id: momentClip.id,
      index: shorts.length + 1,
      startTime: momentClip.startTime,
      endTime: momentClip.endTime,
      duration: momentClip.duration,
      filename: generateLocalShortFilename(momentClip.title, shorts.length + 1, momentClip.duration, resolutionTier, 60),
      topic: momentClip.title,
      hook: {
        id: `moment-hook-${Date.now()}`,
        category: 'Surprise',
        text: momentClip.suggestedHookText,
        suggestedDurationSeconds: 3.0,
      },
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
    if (videoRef.current) {
      videoRef.current.currentTime = momentClip.startTime;
    }
  };

  const currentPlatformPreset = PLATFORM_PRESETS[selectedPlatform] || PLATFORM_PRESETS.universal;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Privacy Banner */}
      <div className="bg-emerald-950/60 border-b border-emerald-500/20 px-4 py-2 text-center text-xs sm:text-sm text-emerald-300 flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Private by design</strong> — your videos are processed locally in your browser with WebCodecs. Zero cloud uploads, zero API fees.
        </span>
      </div>

      {/* Main Studio Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                PulseCut AI 2.5
              </span>
              <span className="text-xs text-slate-400">• By Code With Bitwizards</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Intelligent AI Clipping Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Dual-source video import, GTA VI gaming detection, 12 kinetic subtitle themes, and 60 FPS hardware MP4 export.
            </p>
          </div>

          {/* Engine Mode Switcher Bar */}
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

        {/* Video Ingestion Area (When no video loaded yet) */}
        {!videoSrc && (
          <div className="space-y-4">
            <DualSourceDropzone onVideoSelected={(file) => loadVideoFile(file)} />
          </div>
        )}

        {/* Loaded Video Info Bar */}
        {videoSrc && videoFile && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-white truncate max-w-sm sm:max-w-md">
                  {videoFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  {Math.round(videoDuration)}s duration • {videoWidth}×{videoHeight} •{' '}
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • {videoFps} FPS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFindMomentsOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                Find Moments
              </button>
              <button
                onClick={() => {
                  setVideoSrc(null);
                  setVideoFile(null);
                  setShorts([]);
                }}
                className="rounded-xl border border-slate-700 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors"
              >
                Change Video
              </button>
            </div>
          </div>
        )}

        {/* Studio Grid: Left Controls | Center Preview | Right Cards */}
        {videoSrc && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT PANEL: Intelligent Controls (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
              {/* Mode Settings Banner */}
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

              {/* Clip Duration & Number of Clips */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Clip Duration: <span className="text-cyan-400">{clipDuration}s</span>
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {shorts.length} Shorts planned
                  </span>
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

              {/* Target Platform Preset */}
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

              {/* Reframing Strategy & Editing Style */}
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

              {/* Kinetic Subtitle Theme */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Subtitle Typography Theme
                  </label>
                  <button
                    onClick={handleGenerateCaptions}
                    disabled={isTranscribing}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    {isTranscribing ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Transcribing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3 w-3" />
                        Auto-Transcribe
                      </>
                    )}
                  </button>
                </div>
                <select
                  value={subtitleThemeId}
                  onChange={(e) => setSubtitleThemeId(e.target.value as SubtitleThemeId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-semibold"
                >
                  {Object.values(SUBTITLE_THEMES).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export Quality Tier */}
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

              {/* Memory Cleanup */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <button
                  onClick={handleClearTemporaryFiles}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Temporary Buffers
                </button>
                <span className="text-[11px] text-slate-500">IndexedDB Active</span>
              </div>
            </div>

            {/* CENTER PANEL: Live 9:16 Video Player & Safe Zone Preview (lg:col-span-4) */}
            <div className="lg:col-span-4 flex flex-col items-center space-y-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive 9:16 Preview
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                      !isMuted
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {isMuted ? (
                      <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    <span>{isMuted ? 'Muted' : 'Sound ON'}</span>
                  </button>
                  <button
                    onClick={() => setShowSafeZones(!showSafeZones)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      showSafeZones
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Safe Zones: {showSafeZones ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* 9:16 Canvas Wrapper */}
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <video
                  ref={videoRef}
                  src={videoSrc || undefined}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  playsInline
                  muted={isMuted}
                  className="hidden"
                />

                <canvas
                  ref={previewCanvasRef}
                  width={1080}
                  height={1920}
                  className="w-full h-full object-cover"
                />

                {showSafeZones && (
                  <div
                    className="absolute pointer-events-none inset-0 border-2 border-dashed border-red-500/40"
                    style={{
                      top: `${currentPlatformPreset.uiSafeZone.topPercent}%`,
                      bottom: `${currentPlatformPreset.uiSafeZone.bottomPercent}%`,
                      left: `${currentPlatformPreset.uiSafeZone.leftPercent}%`,
                      right: `${currentPlatformPreset.uiSafeZone.rightPercent}%`,
                    }}
                  >
                    <div className="absolute top-2 left-2 bg-red-500/80 text-white font-mono text-[9px] px-1 rounded">
                      UI SAFE ZONE
                    </div>
                  </div>
                )}

                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all group"
                >
                  <div className="h-12 w-12 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-white border border-slate-700 shadow-xl group-hover:scale-110 transition-transform">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </div>
                </button>
              </div>

              {/* Timeline Scrubbing */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span>Short #{activeShortIndex + 1} of {shorts.length}</span>
                  <span>{videoDuration.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={videoDuration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (videoRef.current) {
                      videoRef.current.currentTime = val;
                      setCurrentTime(val);
                    }
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Subtitle Downloads */}
              <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-300">Synchronized Captions</span>
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

            {/* RIGHT PANEL: Output Short Cards & Batch Render (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Generated Shorts ({shorts.length})
                  </h3>
                  <p className="text-xs text-slate-500">Heuristic Viral Ranking (0–100)</p>
                </div>
                <button
                  onClick={handleRenderAll}
                  disabled={isBatchRendering || shorts.length === 0}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Render All {resolutionTier.toUpperCase()}
                </button>
              </div>

              {/* Short Cards List */}
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {shorts.map((short, idx) => {
                  const isActive = activeShortIndex === idx;
                  return (
                    <div
                      key={short.id}
                      onClick={() => jumpToShort(idx)}
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
                            <span className="text-[11px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
                              {short.duration}s
                            </span>
                            <span className="text-[11px] font-mono px-1.5 py-0.2 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                              9:16 • 60 FPS
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                            ⚡ {short.hook.text}
                          </div>
                          {short.explanation && (
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {short.explanation}
                            </p>
                          )}
                        </div>

                        {/* Viral Potential Score Badge */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                          <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-0.5">
                            <Flame className="h-3 w-3 text-emerald-400" />
                            {short.score || short.engagement.score}/100
                          </span>
                        </div>
                      </div>

                      {/* Rendering Progress */}
                      {short.status === 'rendering' && (
                        <div className="mt-2.5 space-y-1">
                          <div className="flex justify-between text-[11px] text-cyan-300">
                            <span>{short.stageText}</span>
                            <span>{short.renderProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 transition-all duration-150"
                              style={{ width: `${short.renderProgress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Editable Filename + Action Buttons */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[11px] text-slate-400 font-mono truncate" title={short.filename}>
                            {short.filename}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Customize / Edit Clip Modal Trigger */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClipIndex(idx);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit clip boundaries, hook, or reframe"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </button>

                          {short.status !== 'ready' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenderShort(idx);
                              }}
                              disabled={short.status === 'rendering'}
                              className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
                            >
                              <Cpu className="h-3 w-3 text-cyan-400" />
                              Render
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {short.outputUrl && (
                                <a
                                  href={short.outputUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-all"
                                >
                                  <Play className="h-3 w-3" />
                                  Play
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(short);
                                }}
                                className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all"
                              >
                                <Download className="h-3 w-3" />
                                MP4
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
        audioPeakTimes={audioPeakTimes}
        onSelectMoment={handleMomentFound}
      />

      {/* Clip Editor Modal */}
      {editingClipIndex !== null && shorts[editingClipIndex] && (
        <ClipEditorModal
          clip={{
            id: shorts[editingClipIndex].id,
            projectId: 'local',
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
                      hook: {
                        ...s.hook,
                        text: updated.selectedHook?.text || s.hook.text,
                      },
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
