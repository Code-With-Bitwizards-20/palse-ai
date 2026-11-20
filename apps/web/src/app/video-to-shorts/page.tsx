import React from 'react';
import Link from 'next/link';
import { Cloud, Video, Sparkles, Zap, Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video to Shorts Converter — Cloud AI Media Processing',
  description:
    'Convert long videos into viral 9:16 Shorts, TikToks, and Reels using remote cloud FFmpeg workers. 60 FPS rendering, kinetic subtitles, and platform presets.',
};

export default function VideoToShortsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-4 py-1.5 text-xs sm:text-sm font-semibold text-brand-300 mb-6">
          <Cloud className="h-4 w-4 text-brand-400" />
          Cloud-Powered Processing • Zero Local Hardware Load
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Turn Any Long Video into Platform-Ready{' '}
          <span className="bg-gradient-to-r from-brand-400 via-accent-cyan to-brand-500 bg-clip-text text-transparent">
            Shorts in Seconds
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The high-performance cloud studio that cuts, reframes to 9:16, generates kinetic subtitles, and renders 60 FPS MP4s on dedicated remote media workers.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/studio"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 transition-all active:scale-95"
          >
            <Sparkles className="h-5 w-5" />
            Launch Shorts Studio
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/features"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 px-8 py-4 text-base font-bold text-slate-300 hover:text-white transition-all"
          >
            Explore Capabilities
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Remote FFmpeg 60 FPS</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              High-performance remote media workers render smooth 60 FPS vertical video at 1080p, 2K, or 4K with auto hardware encoder detection.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cloud className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Zero Device Load</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your computer is never burdened with heavy video encoding. All demuxing, trimming, caption burn-in, and MP4 muxing happens on remote workers with automatic 24h file cleanup.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Platform Safe-Zone Certified</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Target YouTube Shorts, TikTok, Instagram Reels, and Threads with guaranteed UI safe-zone compliance for hooks and subtitles.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
