'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Link2,
  FileVideo,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Youtube,
  Tv,
  Film,
  DownloadCloud,
  X,
  Sparkles,
} from 'lucide-react';
import { validateVideoUrl, UrlValidationResult } from '../services/url-validator';
import { probeDirectMediaCors, downloadDirectMedia } from '../services/direct-media.service';
import { DirectMediaProgress, MediaMetadata } from '../types/source.types';

interface DualSourceDropzoneProps {
  onVideoSelected: (file: File, metadata?: Partial<MediaMetadata>) => void;
  isProcessing?: boolean;
}

export function DualSourceDropzone({ onVideoSelected, isProcessing }: DualSourceDropzoneProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'platforms'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  // URL Import State
  const [urlInput, setUrlInput] = useState('');
  const [urlValidation, setUrlValidation] = useState<UrlValidationResult | null>(null);
  const [importStatus, setImportStatus] = useState<
    'idle' | 'checking' | 'downloading' | 'probing' | 'ready' | 'error'
  >('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DirectMediaProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Local File Drag & Drop
  // -------------------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndDeliverFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndDeliverFile(file);
    }
  };

  const validateAndDeliverFile = (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm|mkv|m4v)$/i)) {
      setImportError('Please provide a valid video file (.mp4, .mov, .webm, .mkv).');
      return;
    }
    setImportError(null);
    onVideoSelected(file);
  };

  // -------------------------------------------------------------------------
  // URL Input Validation & Acquisition
  // -------------------------------------------------------------------------
  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    setImportError(null);
    if (!value.trim()) {
      setUrlValidation(null);
      return;
    }
    const result = validateVideoUrl(value);
    setUrlValidation(result);
  };

  const handleImportUrl = async () => {
    if (!urlValidation || !urlValidation.isValid) return;

    if (!urlValidation.isDirectMedia && urlValidation.platform !== 'unknown') {
      // Social platform URL that cannot be read directly due to CORS
      setActiveTab('platforms');
      return;
    }

    setImportStatus('checking');
    setImportError(null);
    abortControllerRef.current = new AbortController();

    try {
      // 1. Probe CORS headers
      const cors = await probeDirectMediaCors(urlValidation.normalizedUrl, abortControllerRef.current.signal);
      if (!cors.accessible) {
        setImportStatus('error');
        setImportError(cors.error || 'Server did not respond with acceptable CORS headers.');
        return;
      }

      // 2. Progressive download into browser memory
      setImportStatus('downloading');
      const file = await downloadDirectMedia(
        urlValidation.normalizedUrl,
        (progress) => setDownloadProgress(progress),
        abortControllerRef.current.signal
      );

      setImportStatus('ready');
      validateAndDeliverFile(file);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setImportStatus('idle');
        setImportError('Download cancelled.');
      } else {
        setImportStatus('error');
        setImportError(err.message || 'Failed to download direct media.');
      }
    }
  };

  const cancelUrlImport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setImportStatus('idle');
    setDownloadProgress(null);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800/80 bg-slate-950/40">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-semibold transition-all ${
            activeTab === 'upload'
              ? 'border-b-2 border-cyan-400 text-cyan-400 bg-cyan-500/5'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Upload Video File</span>
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-400 font-mono">
            Fastest
          </span>
        </button>

        <button
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-semibold transition-all ${
            activeTab === 'url'
              ? 'border-b-2 border-purple-400 text-purple-400 bg-purple-500/5'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link2 className="h-4 w-4" />
          <span>Import Video URL</span>
        </button>

        <button
          onClick={() => setActiveTab('platforms')}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-semibold transition-all ${
            activeTab === 'platforms'
              ? 'border-b-2 border-indigo-400 text-indigo-400 bg-indigo-500/5'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Youtube className="h-4 w-4" />
          <span>Social Platform Import</span>
        </button>
      </div>

      <div className="p-6">
        {/* =========================================================================
            TAB 1: LOCAL FILE UPLOAD (PRIMARY)
            ========================================================================= */}
        {activeTab === 'upload' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]'
                : 'border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.mov,.webm,.mkv"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
              <Upload className="h-8 w-8" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Drop your video here or <span className="text-cyan-400 underline underline-offset-4">browse files</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Supports MP4, MOV, WebM, and MKV. Runs 100% inside your browser using WebCodecs GPU acceleration. Zero cloud uploads.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 rounded-md bg-slate-800/80 px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                100% Private & Local
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-slate-800/80 px-2.5 py-1">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                60 FPS CFR Render
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-slate-800/80 px-2.5 py-1">
                <Film className="h-3.5 w-3.5 text-purple-400" />
                No File Size Limit
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: DIRECT MEDIA URL IMPORT
            ========================================================================= */}
        {activeTab === 'url' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Direct Video URL (MP4 / WebM with CORS enabled)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/assets/gameplay_footage.mp4"
                    disabled={importStatus === 'downloading'}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                  />
                  {urlInput && (
                    <button
                      onClick={() => handleUrlChange('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {importStatus === 'downloading' ? (
                  <button
                    onClick={cancelUrlImport}
                    className="flex items-center gap-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 px-5 py-3 text-xs font-semibold text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={handleImportUrl}
                    disabled={!urlValidation?.isValid || importStatus === 'checking'}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    {importStatus === 'checking' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="h-4 w-4" />
                        Import Media
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Validation Feedback & Platform Redirect */}
            {urlValidation && !urlValidation.isDirectMedia && urlValidation.platform !== 'unknown' && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-amber-200">
                      {urlValidation.platform.toUpperCase()} URL Detected
                    </p>
                    <p className="text-slate-300 mt-1">{urlValidation.helpMessage}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('platforms')}
                  className="mt-2 text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2 flex items-center gap-1"
                >
                  View official download guide for this platform &rarr;
                </button>
              </div>
            )}

            {/* Live Download Progress */}
            {importStatus === 'downloading' && downloadProgress && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 space-y-2">
                <div className="flex justify-between text-xs font-medium text-cyan-300">
                  <span>Downloading direct media to browser memory...</span>
                  <span>{downloadProgress.percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-150"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {(downloadProgress.bytesLoaded / (1024 * 1024)).toFixed(1)} MB of{' '}
                  {(downloadProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            )}

            {/* Error Display */}
            {importError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: SOCIAL PLATFORM GUIDANCE
            ========================================================================= */}
        {activeTab === 'platforms' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-1">
                <Info className="h-4 w-4" />
                <span>Zero-Cost Privacy Architecture</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                To guarantee 100% free processing without cloud subscription fees or illegal scraping proxies, PulseCut AI runs in your browser. Follow these one-click official steps to download your source video and process it privately:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* YouTube Guide */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Youtube className="h-4 w-4 text-red-400" />
                  <span>YouTube Studio (Your Videos & Streams)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>Go to <strong>studio.youtube.com</strong> &rarr; Content.</li>
                  <li>Hover over your video or Live stream VOD.</li>
                  <li>Click Options (⋮) &rarr; <strong>Download</strong>.</li>
                  <li>Drop the MP4 into the "Upload Video File" tab.</li>
                </ol>
              </div>

              {/* Twitch Guide */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Tv className="h-4 w-4 text-purple-400" />
                  <span>Twitch Broadcasts / Highlights</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>Open <strong>dashboard.twitch.tv</strong> &rarr; Video Producer.</li>
                  <li>Locate your stream or highlight.</li>
                  <li>Click More (⋮) &rarr; <strong>Download</strong>.</li>
                  <li>Drop the file into PulseCut AI.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-5 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Return to File Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
