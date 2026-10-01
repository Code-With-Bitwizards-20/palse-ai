import React from 'react';
import Link from 'next/link';
import { SUBTITLE_THEMES } from '@shorts/video-config';
import { Type, Sparkles, Check, ArrowRight, Shield } from 'lucide-react';

export const metadata = {
  title: 'Karaoke Subtitle Engine — 10+ Dynamic Themes | ShortsEngine',
  description:
    'Explore professional short-form subtitle styles with word-level karaoke highlighting, native ASS burn-in, and strict social safe zone protection.',
};

export default function CaptionsPage() {
  const themes = Object.values(SUBTITLE_THEMES);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Professional Typography
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Short-Form Subtitle Studio
        </h1>
        <p className="text-sm sm:text-base text-gray-300">
          Captions generated with exact word timestamps, dynamic karaoke pops, high-contrast
          strokes, and placement outside platform UI safe zones.
        </p>
      </div>

      {/* Themes Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="flex flex-col rounded-2xl border border-gray-800 bg-surface-100 overflow-hidden shadow-lg hover:border-brand-500/40 transition-all"
          >
            {/* Visual Preview Box */}
            <div className="h-40 w-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4 relative border-b border-gray-800/80">
              <div className="text-center space-y-1">
                <span
                  style={{
                    color: theme.primaryColorHex,
                    fontFamily: theme.fontFamily.split(',')[0],
                    fontWeight: theme.fontWeight,
                  }}
                  className="text-lg tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  TURN YOUR VIDEO
                </span>
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    style={{
                      color: theme.id === 'karaoke-highlight' ? '#33E600' : theme.primaryColorHex,
                      fontFamily: theme.fontFamily.split(',')[0],
                      fontWeight: theme.fontWeight,
                    }}
                    className="text-xl uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
                  >
                    INTO SHORTS
                  </span>
                  <span className="inline-block h-2 w-2 rounded-full bg-brand-400 animate-ping" />
                </div>
              </div>

              <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 border border-white/10">
                {theme.animationStyle}
              </span>
            </div>

            {/* Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-bold text-white text-base">{theme.name}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{theme.description}</p>
              </div>

              <div className="text-[11px] text-gray-500 space-y-1 pt-2 border-t border-gray-800/60 font-mono">
                <div className="flex justify-between">
                  <span>Font:</span>
                  <span className="text-gray-300">{theme.fontFamily.split(',')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Group words:</span>
                  <span className="text-gray-300">{theme.wordsPerCaptionGroup} words/group</span>
                </div>
                <div className="flex justify-between">
                  <span>Safe margin:</span>
                  <span className="text-gray-300">{theme.marginV}px vertical</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-sm font-bold text-white hover:bg-brand-600 transition-all"
        >
          <span>Use These Subtitles in Your Project</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
