import React from 'react';
import Link from 'next/link';
import { Video, ShieldCheck, Cpu, Code2, Sparkles, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About PulseCut Local AI — Zero Cloud, 100% In-Browser Media Engineering',
  description:
    'Learn about our engineering philosophy: browser-native WebCodecs, Mediabunny, local Whisper models, and zero cloud media storage.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      <div className="space-y-4 text-center sm:text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Engineering Manifesto
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Privacy-First Media Engineering for the Modern Web
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          PulseCut Local AI is built on a simple premise: your creative media should never have to be uploaded to an expensive cloud server farm just to create short-form clips.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <Cpu className="h-6 w-6 text-brand-400" />
          <h3 className="text-base font-bold text-white">Browser-Native WebCodecs Pipeline</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            By combining WebCodecs, Mediabunny, OffscreenCanvas, and Web Workers, we decode and reframe video streams with hardware acceleration directly inside the browser.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Ethical AI & Absolute Privacy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No API keys, no monthly subscriptions, and no cloud transcriptions. All AI inferences execute on your physical hardware, protecting your unreleased footage and personal discussions.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Ready to create shorts without leaving your browser?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Start converting your horizontal recordings into 9:16 vertical shorts in seconds.
        </p>
        <Link
          href="/shorts-editor"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 py-3 text-xs font-bold text-white transition-all shadow-lg shadow-brand-500/20"
        >
          <Sparkles className="h-4 w-4" />
          <span>Launch Local Shorts Studio</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
