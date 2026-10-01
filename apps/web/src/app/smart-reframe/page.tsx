import React from 'react';
import Link from 'next/link';
import { Maximize2, Sparkles, ShieldCheck, ArrowRight, Eye, Smartphone } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Reframe — Horizontal to Vertical 9:16 Video AI | PulseCut',
  description:
    'Convert horizontal 16:9 widescreen footage into vertical 9:16 Shorts without camera jitter. Face tracking, cinematic pan, and blurred background fallback.',
};

export default function SmartReframePage() {
  const modes = [
    {
      title: 'AI Smart Pan',
      desc: 'Cinematic eased motion that gently glides across widescreen scenes without jerky sudden cuts.',
    },
    {
      title: 'Face Focus',
      desc: 'Tracks human faces using on-device vision landmarks and keeps the active speaker centered.',
    },
    {
      title: 'Fit + Blur Background',
      desc: 'Preserves the entire original 16:9 frame in the center while filling the 9:16 canvas with an ambient blurred version.',
    },
    {
      title: 'Speaker Focus (Interviews)',
      desc: 'Intelligently follows conversational cadence between multiple people on screen.',
    },
    {
      title: 'Gameplay Focus',
      desc: 'Avoids cropping critical HUD action and weapon crosshairs in gaming video recordings.',
    },
    {
      title: 'Manual Pan Control',
      desc: 'Fine-tune exact horizontal pan offset from 0% left to 100% right with instant live preview.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3.5 py-1 text-xs font-semibold text-brand-300">
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Horizontal to Vertical 9:16 Intelligence</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          Never Settle for Simple{' '}
          <span className="bg-gradient-to-r from-brand-400 via-accent-cyan to-brand-500 bg-clip-text text-transparent">
            Center Crop
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          PulseCut Local AI analyses your video frames directly on your GPU to produce stabilized, jitter-free 9:16 vertical compositions.
        </p>
        <div className="pt-2">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Reframe Video in Studio</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map((m, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 hover:border-brand-500/40 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">{m.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
