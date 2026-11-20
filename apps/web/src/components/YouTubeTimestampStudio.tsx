'use client';

import React, { useState } from 'react';
import {
  Youtube,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Upload,
  Info,
  Film,
  Sparkles,
  ArrowRight,
  Bookmark,
} from 'lucide-react';

export interface YouTubeTimestampClip {
  id: string;
  index: number;
  title: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  duration: number;  // in seconds
  notes?: string;
}

interface YouTubeTimestampStudioProps {
  videoId: string;
  initialTitle?: string;
  author?: string;
  url: string;
  onUploadOriginal: () => void;
  onChangeUrl: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function parseTime(input: string): number | null {
  const clean = input.trim();
  if (/^\d+(\.\d+)?$/.test(clean)) {
    return parseFloat(clean);
  }
  const parts = clean.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseFloat(parts[2]);
    if (!isNaN(hours) && !isNaN(mins) && !isNaN(secs)) {
      return hours * 3600 + mins * 60 + secs;
    }
  }
  return null;
}

export function YouTubeTimestampStudio({
  videoId,
  initialTitle,
  author,
  url,
  onUploadOriginal,
  onChangeUrl,
}: YouTubeTimestampStudioProps) {
  const [clips, setClips] = useState<YouTubeTimestampClip[]>([
    {
      id: 'clip-1',
      index: 1,
      title: 'Opening Hook & Teaser',
      startTime: 0,
      endTime: 30,
      duration: 30,
      notes: 'Key introductory statement',
    },
    {
      id: 'clip-2',
      index: 2,
      title: 'Core Highlight Moment',
      startTime: 45,
      endTime: 105,
      duration: 60,
      notes: 'Peak emotional reaction',
    },
  ]);

  const [startInput, setStartInput] = useState('00:00');
  const [endInput, setEndInput] = useState('00:30');
  const [titleInput, setTitleInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const handleAddClip = (e: React.FormEvent) => {
    e.preventDefault();
    const startSec = parseTime(startInput);
    const endSec = parseTime(endInput);

    if (startSec === null || endSec === null || startSec >= endSec) {
      alert('Please provide valid Start and End times where Start is earlier than End.');
      return;
    }

    const duration = Math.round((endSec - startSec) * 10) / 10;
    const newClip: YouTubeTimestampClip = {
      id: `clip-${Date.now()}`,
      index: clips.length + 1,
      title: titleInput.trim() || `Highlight Moment #${clips.length + 1}`,
      startTime: startSec,
      endTime: endSec,
      duration,
      notes: notesInput.trim() || undefined,
    };

    setClips((prev) => [...prev, newClip]);
    setTitleInput('');
    setNotesInput('');
  };

  const handleDeleteClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, index: i + 1 })));
  };

  const getChaptersText = (): string => {
    return clips
      .map((c) => `${formatTime(c.startTime)} - ${c.title}`)
      .join('\n');
  };

  const copyToClipboard = async (text: string, formatName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(formatName);
      setTimeout(() => setCopiedFormat(null), 2500);
    } catch {
      // Fallback
    }
  };

  const downloadJson = () => {
    const payload = {
      source: 'YouTube Official Preview',
      videoId,
      videoUrl: url,
      title: initialTitle,
      author,
      exportedAt: new Date().toISOString(),
      timestampClips: clips,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `youtube_${videoId}_timestamps.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const downloadCsv = () => {
    const headers = 'Index,Title,StartTimeSeconds,EndTimeSeconds,DurationSeconds,FormattedRange,Notes,YouTubeLink\n';
    const rows = clips
      .map(
        (c) =>
          `${c.index},"${c.title.replace(/"/g, '""')}",${c.startTime},${c.endTime},${c.duration},"${formatTime(c.startTime)} - ${formatTime(c.endTime)}","${(c.notes || '').replace(/"/g, '""')}","https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(c.startTime)}s"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `youtube_${videoId}_timestamps.csv`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & YouTube Compliance Notice */}
      <div className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/30 via-slate-900/80 to-slate-900 p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Youtube className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">YouTube Timestamp Studio</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  Official Embed Preview
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {initialTitle || `Video ID: ${videoId}`} {author && `• by ${author}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUploadOriginal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Original to Render MP4</span>
            </button>
            <button
              onClick={onChangeUrl}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
            >
              Change URL
            </button>
          </div>
        </div>

        {/* Policy disclaimer */}
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-xs text-slate-300">
          <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Platform Terms Compliance:</strong> PulseCut AI does not scrape, rip, or download YouTube video streams without authorization. This preview mode uses the official YouTube player so you can accurately scrub timestamps, mark highlight segments, and export an Edit Decision List (EDL) or YouTube chapter list.
          </p>
        </div>
      </div>

      {/* Main Grid: Player + Timestamp Marker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Official YouTube Embedded Player */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&enablejsapi=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
            <div className="p-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Youtube className="h-4 w-4 text-red-400" />
                Official YouTube Embed Player
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 flex items-center gap-1"
              >
                Open in YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right: Clip Marker Tool */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-cyan-400" />
              <span>Mark Highlight Timestamp</span>
            </h3>

            <form onSubmit={handleAddClip} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Start (MM:SS or Sec)
                  </label>
                  <input
                    type="text"
                    value={startInput}
                    onChange={(e) => setStartInput(e.target.value)}
                    placeholder="00:00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    End (MM:SS or Sec)
                  </label>
                  <input
                    type="text"
                    value={endInput}
                    onChange={(e) => setEndInput(e.target.value)}
                    placeholder="00:30"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Clip Title / Hook Idea
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Insane Chase Sequence"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Editing Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. 9:16 vertical, yellow bold karaoke captions"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Save Timestamp to EDL</span>
              </button>
            </form>
          </div>

          {/* Quick Creator Guidance */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 space-y-2 text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Creator Export Workflow
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Once you mark your timestamps, download the original video from your creator studio and upload it here. PulseCut AI's cloud workers will render the exact time ranges with 60 FPS vertical reframing and animated captions.
            </p>
          </div>
        </div>
      </div>

      {/* Saved Timestamp Clips (EDL) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="h-4 w-4 text-cyan-400" />
              <span>Saved Timestamp Clips ({clips.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Exportable Edit Decision List (EDL) for video production.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => copyToClipboard(getChaptersText(), 'chapters')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              {copiedFormat === 'chapters' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedFormat === 'chapters' ? 'Chapters Copied!' : 'Copy Chapters'}</span>
            </button>
            <button
              onClick={downloadJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={downloadCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {clips.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No timestamp clips saved yet. Use the marker above to save interesting moments.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                      #{clip.index}
                    </span>
                    <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                      {clip.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleDeleteClip(clip.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Delete timestamp"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="font-mono text-cyan-300">
                    {formatTime(clip.startTime)} → {formatTime(clip.endTime)} ({clip.duration}s)
                  </span>
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(clip.startTime)}s`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white flex items-center gap-1 text-[11px] text-slate-400"
                  >
                    Jump <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {clip.notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-800/80">
                    {clip.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
