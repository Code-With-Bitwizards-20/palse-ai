import React from 'react';
import Link from 'next/link';
import { Type, Sparkles, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { SUBTITLE_THEMES } from '@/lib/subtitles';

export const metadata: Metadata = {
  title: 'AI Captions & Kinetic Subtitle Engine — PulseCut Local AI',
  description:
    'Generate viral word-highlight karaoke subtitles and animated kinetic captions directly in your browser with local Whisper AI. Zero API fees.',
};

export default function AiCaptionsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3.5 py-1 text-xs font-semibold text-brand-300">
          <Type className="h-3.5 w-3.5" />
          <span>Word-Level Kinetic Caption Engine</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          Animated Subtitles That{' '}
          <span className="bg-gradient-to-r from-brand-400 via-accent-cyan to-brand-500 bg-clip-text text-transparent">
            Demand Attention
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          Powered by on-device Whisper models. Active word popping, multi-color themes, karaoke pacing, and platform safe-zone compliance.
        </p>
        <div className="pt-2">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Captions in Studio</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Subtitle Theme Showcase */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">12 Dynamic Creator Subtitle Themes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(SUBTITLE_THEMES).map((theme) => (
            <div
              key={theme.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {theme.name}
                </span>
                <div
                  className="mt-3 p-3 rounded-xl flex items-center justify-center text-center font-extrabold text-sm"
                  style={{
                    backgroundColor: theme.backgroundColor || 'rgba(0,0,0,0.5)',
                    color: theme.textColor,
                    textTransform: theme.textTransform,
                  }}
                >
                  <span style={{ color: theme.highlightColor }} className="mr-1.5 underline">
                    VIRAL
                  </span>{' '}
                  CAPTION PREVIEW
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-800/80">
                <span>Animation: {theme.animationStyle}</span>
                <span>Safe-zone compliant</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
