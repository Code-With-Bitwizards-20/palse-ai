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
} from 'lucide-react';
import { calculateClips, RemainderStrategy, ClipBoundary } from '@shorts/shared';
import { PLATFORM_PRESETS, PlatformId } from '@shorts/platform-presets';
import {
  detectDeviceCapabilities,
  DeviceCapabilities,
  DevicePerformanceLevel,
} from '@/lib/deviceDetector';
import {
  generateHooks,
  generatePlatformMetadata,
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

  // Configuration State
  const [clipDuration, setClipDuration] = useState<number>(30);
  const [remainderStrategy, setRemainderStrategy] = useState<RemainderStrategy>('ignore');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('universal');
  const [reframeStrategy, setReframeStrategy] = useState<ReframeStrategy>('AI Smart');
  const [editingStyle, setEditingStyle] = useState<EditingStyle>('Balanced');
  const [resolutionTier, setResolutionTier] = useState<'1080p' | '2k' | '4k'>('1080p');
  const [aiMode, setAiMode] = useState<AIMode>('LIGHT');
  const [subtitleThemeId, setSubtitleThemeId] = useState<SubtitleThemeId>('creator');
  const [showSafeZones, setShowSafeZones] = useState(true);

  // Subtitles / Cues
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([
    { id: 'c1', startTime: 0, endTime: 3.2, text: 'This secret changes everything about creating shorts.' },
    { id: 'c2', startTime: 3.2, endTime: 7.0, text: 'You no longer need expensive cloud servers or subscriptions.' },
    { id: 'c3', startTime: 7.0, endTime: 12.0, text: 'Everything runs 100% directly in your browser with WebCodecs.' },
    { id: 'c4', startTime: 12.0, endTime: 18.0, text: 'Your video never leaves your computer, ensuring absolute privacy.' },
  ]);

  // Generated Shorts Plan
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [activeShortIndex, setActiveShortIndex] = useState<number>(0);

  // Interactive Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Global rendering state
  const [isBatchRendering, setIsBatchRendering] = useState(false);
  // Ref for synchronous export-lock check inside preview loop and render callbacks.
  // React state updates are async; a ref gives immediate, synchronous correctness.
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

  // 2. Handle Video File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideoFile(file);
    }
  };

  const loadVideoFile = (file: File) => {
    // Invalidate the audio decode cache whenever a new source file is loaded
    clearAudioCache();
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setIsPlaying(false);
    setCurrentTime(0);
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

  // 4. Calculate Shorts Timeline Plan
  useEffect(() => {
    if (videoDuration <= 0) return;

    try {
      const result = calculateClips(videoDuration, clipDuration, remainderStrategy);
      const generated: ShortItem[] = result.clips.map((clip) => {
        const dummyTranscript = `Clip ${clip.index}: Advanced insights and key takeaways from ${clip.startTime}s to ${clip.endTime}s.`;
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
          topic: `Key Takeaway #${clip.index}`,
          hook: primaryHook,
          engagement,
          status: 'idle',
        };
      });

      setShorts(generated);
      if (generated.length > 0 && activeShortIndex >= generated.length) {
        setActiveShortIndex(0);
      }
    } catch (err) {
      console.error('Error calculating clips:', err);
    }
  }, [videoDuration, clipDuration, remainderStrategy, resolutionTier]);

  // 5. Realtime Interactive Preview Canvas Loop
  //    FIX: Use isBatchRenderingRef (synchronous ref) rather than deriving
  //    isExporting from stale React state. Avoids race where preview loop
  //    resumes and seeks sourceVideo mid-batch transition.
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      // Use the ref for synchronous, lag-free batch-lock check
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
          console.warn('Playback with audio blocked by browser policy, attempting muted playback:', err);
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

  // 6. Render Single Short
  // isBatchMode=true disables per-short confirm() dialogs and file pickers
  // (all user decisions must be collected BEFORE the batch starts, not inside it).
  const handleRenderShort = async (shortIndex: number, isBatchMode = false) => {
    const short = shorts[shortIndex];
    if (!short || !videoRef.current) return;

    // 4K capability warning — shown only for single-short renders, never during batch.
    // During batch, the caller must have already confirmed before starting the loop.
    if (!isBatchMode && resolutionTier === '4k' && deviceCaps && !deviceCaps.encode4k60.supported) {
      const proceed = confirm(
        '4K rendering may exceed this device\'s browser/GPU capability. 1080p is recommended. Do you wish to continue anyway?'
      );
      if (!proceed) return;
    }

    setShorts((prev) =>
      prev.map((s, idx) =>
        idx === shortIndex ? { ...s, status: 'rendering', renderProgress: 0, stageText: 'Starting hardware encoder...' } : s
      )
    );

    // File System Access picker — only available for SINGLE-short renders.
    // During Render All (isBatchMode=true), we NEVER call showSaveFilePicker() per short.
    // That would (a) require user activation for each short, and (b) be suppressed
    // by the browser when the tab is backgrounded, causing: "confirm() was suppressed".
    let fileHandle: FileSystemFileHandle | undefined = undefined;
    if (!isBatchMode && typeof window !== 'undefined' && (window as any).showSaveFilePicker) {
      try {
        const useStreaming = confirm(
          `Stream "${short.filename}" directly to your disk to save browser memory? (Recommended for large files)`
        );
        if (useStreaming) {
          fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: short.filename,
            types: [
              {
                description: 'MP4 Video',
                accept: { 'video/mp4': ['.mp4'] },
              },
            ],
          });
        }
      } catch {
        // User cancelled picker, fallback to in-memory Blob
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
            ? {
                ...s,
                status: 'error',
                stageText: err?.message || 'Rendering failed due to encoder limitation.',
              }
            : s
        )
      );
    }
  };

  // 7. Sequential Batch Render All
  //
  // FIX: Stale closure bug — the shorts array captured by the closure at the
  // time handleRenderAll was called would be stale after each await (each short
  // render calls setShorts() multiple times internally). Reading shorts[i].status
  // from the stale closure would always see the INITIAL status snapshot.
  //
  // Fix: take an immutable snapshot of clip definitions upfront (index, startTime,
  // endTime, etc.), then let handleRenderShort read live state via setShorts
  // functional updates. We only need the snapshot to know WHICH shorts to render
  // and their initial status — not the status mid-batch.
  //
  // FIX: Removes confirm()/showSaveFilePicker() during batch by passing isBatchMode=true.
  // All user decisions must happen before the loop starts, while a user gesture is active.
  const handleRenderAll = async () => {
    // Snapshot clip metadata at the start of the batch.
    // Using the current shorts value (closure) is safe HERE because we haven't
    // started awaiting yet — shorts is fresh at this call site.
    const batchItems = shorts.map((s, idx) => ({
      index: idx,
      status: s.status,
    }));

    isBatchRenderingRef.current = true;
    setIsBatchRendering(true);

    // Optional: warn once about 4K before the batch starts (not per-short)
    // This collects the user decision during the button click (user gesture available).
    if (resolutionTier === '4k' && deviceCaps && !deviceCaps.encode4k60.supported) {
      const proceed = confirm(
        '4K rendering may exceed this device\'s GPU capability. The entire batch will attempt 4K. Continue?'
      );
      if (!proceed) {
        isBatchRenderingRef.current = false;
        setIsBatchRendering(false);
        return;
      }
    }

    for (const item of batchItems) {
      if (item.status !== 'ready') {
        // isBatchMode=true — no confirm/picker dialogs inside the loop
        await handleRenderShort(item.index, true);
      }
    }

    isBatchRenderingRef.current = false;
    setIsBatchRendering(false);
  };

  // 8. Rename a Short filename (sanitizes to safe filesystem name)
  const handleRenameShort = (idx: number, rawName: string) => {
    // Strip illegal filesystem chars, ensure .mp4 extension
    const sanitized = rawName
      .replace(/[\\/:*?"<>|]/g, '')
      .trim();
    const name = sanitized.length > 0 ? sanitized : shorts[idx].filename;
    const final = name.endsWith('.mp4') ? name : `${name}.mp4`;
    setShorts((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, filename: final } : s))
    );
    setEditingFilenameIdx(null);
    setEditingFilenameValue('');
  };

  // 9. Download Generated Blob
  const handleDownload = (short: ShortItem) => {
    if (short.outputUrl) {
      const a = document.createElement('a');
      a.href = short.outputUrl;
      a.download = short.filename;
      a.click();
    }
  };

  // 9. Download Subtitles
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

  // 10. Clear Temporary Files & Memory
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

  const currentPlatformPreset = PLATFORM_PRESETS[selectedPlatform] || PLATFORM_PRESETS.universal;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. Privacy Banner */}
      <div className="bg-emerald-950/60 border-b border-emerald-500/20 px-4 py-2 text-center text-xs sm:text-sm text-emerald-300 flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Private by design</strong> — your videos are processed locally in your browser and are not uploaded to our servers.
        </span>
      </div>

      {/* Main Studio Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header & Device Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="bg-gradient-to-r from-brand-400 to-accent-cyan bg-clip-text text-transparent">
                {APP_CONFIG.name}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Browser-native 60 FPS video clipping, smart reframing, kinetic subtitles, and engagement optimization.
            </p>
          </div>

          {/* Device Capability Pill */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 px-4 shadow-inner">
            <Cpu className="h-5 w-5 text-brand-400" />
            <div className="text-xs">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span>Device Level:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    deviceCaps?.performanceLevel === 'Excellent'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : deviceCaps?.performanceLevel === 'Good'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {detectingCaps ? 'Analyzing...' : deviceCaps?.performanceLevel || 'Compatibility'}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {deviceCaps?.webGPU ? 'WebGPU Active' : 'CPU/WASM Fallback'} • 60 FPS WebCodecs{' '}
                {deviceCaps?.encode1080p60.supported ? '✓' : '✗'}
              </div>
            </div>
          </div>
        </div>

        {/* 4K Warning if device doesn't support it */}
        {deviceCaps && !deviceCaps.encode4k60.supported && resolutionTier === '4k' && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs sm:text-sm text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">4K Rendering Advisory</p>
              <p className="text-amber-300/90 mt-0.5">
                4K rendering may exceed this device\'s browser/GPU capability. 1080p is recommended.
              </p>
            </div>
          </div>
        )}

        {/* Studio Grid: Left Controls (1 col) | Center Preview (1 col) | Right Cards (1 col on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: Editing Controls (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
            {/* Step 1: Video File Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                1. Local Video Input
              </label>
              {!videoFile ? (
                <label className="border-2 border-dashed border-slate-700 hover:border-brand-500/80 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">
                  <Upload className="h-8 w-8 text-brand-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-200">Select Video File</span>
                  <span className="text-xs text-slate-500 mt-1">MP4, MOV, WebM, MKV (Zero server upload)</span>
                  <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                </label>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="truncate mr-2">
                    <p className="font-semibold text-slate-200 truncate">{videoFile.name}</p>
                    <p className="text-slate-400">
                      {Math.round(videoDuration)}s • {videoWidth}×{videoHeight} • {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <label className="cursor-pointer text-brand-400 hover:text-brand-300 font-semibold shrink-0">
                    Change
                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Copyright Confirmation Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <input
                type="checkbox"
                id="copyrightCheck"
                checked={copyrightConfirmed}
                onChange={(e) => setCopyrightConfirmed(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="copyrightCheck" className="cursor-pointer select-none">
                I confirm that I own this video or have permission to edit it.
              </label>
            </div>

            {/* Step 2: Target Short Length (Exact Split Mode) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Short Duration: <span className="text-brand-400">{clipDuration}s</span>
                </label>
                <span className="text-xs text-slate-500 font-mono">
                  {shorts.length} Short{shorts.length !== 1 ? 's' : ''} planned
                </span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[15, 20, 30, 45, 60, 90, 120, 180].map((d) => (
                  <button
                    key={d}
                    onClick={() => setClipDuration(d)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      clipDuration === d
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>

              <input
                type="range"
                min={10}
                max={180}
                step={5}
                value={clipDuration}
                onChange={(e) => setClipDuration(Number(e.target.value))}
                className="w-full accent-brand-500"
              />

              {/* Leftover Footage Strategy */}
              <div className="mt-2.5 text-xs">
                <span className="text-slate-400">Leftover Footage Handling:</span>
                <select
                  value={remainderStrategy}
                  onChange={(e) => setRemainderStrategy(e.target.value as RemainderStrategy)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="ignore">Ignore Leftover Footage</option>
                  <option value="shorter-final">Create Shorter Final Clip</option>
                  <option value="redistribute">Redistribute Clip Boundaries Evenly</option>
                  <option value="controlled-overlap">Allow Small Controlled Overlap</option>
                </select>
              </div>
            </div>

            {/* Step 3: Platform Preset */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                3. Target Platform Preset
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

            {/* Step 4: Smart Reframing & Editing Style */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Reframe (9:16)
                </label>
                <select
                  value={reframeStrategy}
                  onChange={(e) => setReframeStrategy(e.target.value as ReframeStrategy)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="AI Smart">AI Smart Pan</option>
                  <option value="Face Focus">Face Focus</option>
                  <option value="Center">Center Crop</option>
                  <option value="Fit + Blur">Fit + Blur BG</option>
                  <option value="Left">Left Third</option>
                  <option value="Right">Right Third</option>
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

            {/* Step 5: Subtitle Theme */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Kinetic Subtitle Theme
              </label>
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

            {/* Step 6: Export Quality Tier */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Export Quality (60 FPS)
                </label>
                <span className="text-[11px] text-brand-400 font-mono">
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
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tier.toUpperCase()}
                  </button>
                ))}
              </div>
              {/* Honest Framerate Notice */}
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Output: 60 FPS</span>
                <span>Source: {videoFps} FPS</span>
                <span>CFR cadence</span>
              </div>
            </div>

            {/* Action: Clear Temporary Files */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={handleClearTemporaryFiles}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                title="Release browser memory caches"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Temporary Buffers
              </button>
              <div className="text-[11px] text-slate-500">Zero Cloud Storage</div>
            </div>
          </div>

          {/* CENTER PANEL: Interactive 9:16 Video Player & Safe Zone Overlay (lg:col-span-4) */}
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
                  title={isMuted ? 'Click to unmute preview audio' : 'Click to mute preview audio'}
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
                      ? 'bg-brand-500/20 border-brand-500/40 text-brand-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Safe Zones: {showSafeZones ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* 9:16 Player Canvas Wrapper */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              {/* HTML5 Video used as visual & audio source for player and engine */}
              <video
                ref={videoRef}
                src={videoSrc || undefined}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                playsInline
                muted={isMuted}
                className="hidden"
              />

              {/* The Live 2D Canvas */}
              <canvas
                ref={previewCanvasRef}
                width={1080}
                height={1920}
                className="w-full h-full object-cover"
              />

              {/* Safe Zone Visual Overlay (Only in editor, never in export) */}
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

              {/* Play / Pause Overlay Icon */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-white border border-slate-700 shadow-xl group-hover:scale-110 transition-transform">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </div>
              </button>
            </div>

            {/* Playback Scrubbing Controls */}
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
                className="w-full accent-brand-500"
              />
            </div>

            {/* Subtitle Editor Quick Actions */}
            <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Transcript & Subtitles</span>
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
                <p className="text-xs text-slate-500">Render on demand to protect RAM</p>
              </div>
              <button
                onClick={handleRenderAll}
                disabled={isBatchRendering || shorts.length === 0}
                className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
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
                        ? 'bg-slate-900 border-brand-500/80 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/40'
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
                          <span className="text-[11px] font-mono px-1.5 py-0.2 bg-brand-500/10 text-brand-300 rounded border border-brand-500/20">
                            9:16 • 60 FPS
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                          ⚡ {short.hook.text}
                        </div>
                      </div>

                      {/* Engagement Potential Badge */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Engagement</span>
                        <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-0.5">
                          <Flame className="h-3 w-3 text-emerald-400" />
                          {short.engagement.score}/100
                        </span>
                      </div>
                    </div>

                    {/* Progress / Status Bar */}
                    {short.status === 'rendering' && (
                      <div className="mt-2.5 space-y-1">
                        <div className="flex justify-between text-[11px] text-brand-300">
                          <span>{short.stageText}</span>
                          <span>{short.renderProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 transition-all duration-150"
                            style={{ width: `${short.renderProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {short.status === 'error' && (
                      <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{short.stageText}</span>
                      </div>
                    )}

                    {/* Editable Filename + Action Buttons */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-2">
                      {/* Filename row */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {editingFilenameIdx === idx ? (
                          <>
                            <input
                              autoFocus
                              value={editingFilenameValue}
                              onChange={(e) => setEditingFilenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameShort(idx, editingFilenameValue);
                                if (e.key === 'Escape') { setEditingFilenameIdx(null); setEditingFilenameValue(''); }
                              }}
                              onBlur={() => handleRenameShort(idx, editingFilenameValue)}
                              className="flex-1 min-w-0 bg-slate-800 border border-brand-500/60 rounded-lg px-2 py-1 text-[11px] text-white font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                              placeholder="my-short-clip"
                              spellCheck={false}
                            />
                            <button
                              onClick={() => handleRenameShort(idx, editingFilenameValue)}
                              className="shrink-0 text-brand-400 hover:text-brand-300 transition-colors"
                              title="Confirm rename"
                            >
                              <CheckSquare className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 min-w-0 text-[11px] text-slate-400 font-mono truncate" title={short.filename}>
                              {short.filename}
                            </span>
                            <button
                              onClick={() => {
                                setEditingFilenameIdx(idx);
                                setEditingFilenameValue(short.filename.replace(/\.mp4$/i, ''));
                              }}
                              className="shrink-0 text-slate-500 hover:text-brand-400 transition-colors"
                              title="Rename output file"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Buttons row */}
                      <div className="flex items-center justify-end gap-2">
                        {short.status !== 'ready' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenderShort(idx);
                            }}
                            disabled={short.status === 'rendering'}
                            className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
                          >
                            <Cpu className="h-3 w-3 text-brand-400" />
                            Render
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {short.outputUrl && (
                              <a
                                href={short.outputUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all"
                                title="Play rendered Short with audio in new tab"
                              >
                                <Play className="h-3 w-3" />
                                Listen
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
                              Download MP4
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
      </div>
    </div>
  );
}
