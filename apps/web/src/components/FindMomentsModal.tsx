'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  X,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Volume2,
  Film,
} from 'lucide-react';
import { searchVideoMoments, SearchableMomentResult } from '@/lib/momentsFinder';
import { SubtitleCue } from '@/lib/subtitles';
import { CandidateClip } from '@/lib/highlightDetector';

interface FindMomentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoDuration: number;
  subtitles: SubtitleCue[];
  audioPeakTimes: number[];
  onSelectMoment: (clip: CandidateClip) => void;
}

export function FindMomentsModal({
  isOpen,
  onClose,
  videoDuration,
  subtitles,
  audioPeakTimes,
  onSelectMoment,
}: FindMomentsModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableMomentResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const matched = searchVideoMoments({
      query,
      videoDuration,
      subtitles,
      audioPeakTimes,
      targetClipDuration: 30,
    });

    setResults(matched);
    setHasSearched(true);
  };

  const handleQuickPrompt = (promptText: string) => {
    setQuery(promptText);
    const matched = searchVideoMoments({
      query: promptText,
      videoDuration,
      subtitles,
      audioPeakTimes,
      targetClipDuration: 30,
    });
    setResults(matched);
    setHasSearched(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="moments-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 id="moments-title" className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span>Find Moments — AI Video Search</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Type natural-language prompts to locate dialogue, high-energy screams, or GTA action.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'funniest moment', 'GTA 6 mention', 'loud reaction'..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-3 text-xs font-bold text-white transition-colors"
          >
            Search
          </button>
        </form>

        {/* Suggested Quick Queries */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-slate-400 py-1">Quick Suggestions:</span>
          {['GTA 6', 'Funniest Moments', 'Loudest Reactions', 'Important Dialogue', 'High Energy'].map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleQuickPrompt(s)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 hover:border-purple-500 hover:text-white transition-colors"
              >
                {s}
              </button>
            )
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {results.length > 0 ? (
            results.map((res, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 hover:border-purple-500/50 transition-colors"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                      {res.confidence}% Match
                    </span>
                    <span className="text-xs font-semibold text-white">{res.clip.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{res.matchedReason}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {res.clip.duration}s Short
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-400" />
                      Score {res.clip.score}/100
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectMoment(res.clip);
                    onClose();
                  }}
                  className="shrink-0 rounded-lg bg-purple-600/30 border border-purple-500/40 hover:bg-purple-600 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:text-white transition-all"
                >
                  Clip This Moment
                </button>
              </div>
            ))
          ) : hasSearched ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-400 space-y-1">
              <AlertCircle className="mx-auto h-6 w-6 text-slate-500 mb-2" />
              <p className="font-semibold text-slate-300">No exact matches found for "{query}".</p>
              <p>Try searching for broader keywords like "GTA", "action", or "secret".</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800/50 bg-slate-950/20 p-8 text-center text-xs text-slate-500">
              Enter a search query or pick a suggestion above to find specific video moments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
