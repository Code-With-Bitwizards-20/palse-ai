import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CalculatorSection } from '@/components/CalculatorSection';
import { PLATFORM_PRESETS } from '@shorts/platform-presets';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'PulseCut Local AI — Private Long Video to Shorts Studio',
  description:
    '100% in-browser, privacy-first AI video clipping studio. Converts long videos into 60 FPS platform-ready Shorts with zero server uploads and zero API keys.',
  alternates: {
    canonical: 'https://palse-ai-by-code-with-bitwizards.vercel.app',
  },
  openGraph: {
    title: 'PulseCut Local AI — Private Long Video to Shorts Studio',
    description:
      'Turn long videos into scroll-stopping 60 FPS Shorts directly in your browser. 100% local processing, zero cloud uploads.',
    url: 'https://palse-ai-by-code-with-bitwizards.vercel.app',
    siteName: 'PulseCut Local AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseCut Local AI — Private Long Video to Shorts Studio',
    description:
      'Turn long videos into scroll-stopping 60 FPS Shorts directly in your browser. 100% local processing, zero cloud uploads.',
  },
};

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 sm:pt-24 lg:pt-32 overflow-hidden">
        {/* Ambient atmospheric gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-brand-500/20 blur-[130px] -z-10 rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[380px] h-[250px] bg-accent-cyan/15 blur-[110px] -z-10 rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Dual Privacy Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>100% local processing</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              <span>No account required</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl max-w-4xl mx-auto leading-[1.12]">
            Turn Long Videos Into{' '}
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-accent-cyan bg-clip-text text-transparent">
              Powerful Shorts — Locally.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
            AI-assisted clipping, captions, reframing and editing directly in your browser. No uploads. No API keys.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/studio"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-brand-500/30 hover:from-brand-600 hover:to-brand-700 transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Create Shorts</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-7 py-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-sm"
            >
              <Eye className="h-4 w-4 text-slate-300" />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Privacy Guarantee Pill */}
          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              WebCodecs 60 FPS Engine
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Zero Cloud Storage
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Instant Free Access
            </span>
          </div>
        </div>
      </section>

      {/* 2. DURATION CALCULATOR DEMO SECTION — lazy loaded client component */}
      <CalculatorSection />

      {/* 3. HOW IT WORKS SECTION — below-fold, use content-visibility for paint skip */}
      <section id="how-it-works" className="cv-auto mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Browser Pipeline</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How Client-Side Video AI Works
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            No servers, no queues, no privacy risks. Every step executes inside your browser tab.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Select Local File</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Read metadata locally via HTML5 File API and Mediabunny. Your video is never sent over any network.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan font-bold">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Smart 9:16 Reframe</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Horizontal video is intelligently reframed using face tracking, AI Smart Pan, or cinematic Fit+Blur background.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Kinetic Subtitles &amp; Hooks</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generate opening hook headlines and animated word-highlight captions inside platform-safe zones.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              4
            </div>
            <h3 className="text-lg font-bold text-white">60 FPS Hardware Render</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              GPU-accelerated WebCodecs encode frames directly to MP4 and stream output directly to your disk.
            </p>
          </div>
        </div>
      </section>

      {/* 4. PLATFORMS SUPPORTED — below-fold */}
      <section className="cv-auto mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Target Every Major Platform</h2>
          <p className="text-slate-300 text-sm">
            Calibrated safe zones and metadata character limits for 2026 platform specifications.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.values(PLATFORM_PRESETS).map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 text-center hover:border-brand-500/40 transition-all"
            >
              <div className="text-sm font-bold text-white truncate">{p.name.split(' ')[0]}</div>
              <div className="text-[11px] text-brand-300 font-mono mt-1">9:16 • 60 FPS</div>
              <div className="text-[11px] text-slate-300 mt-1">Safe-Zone Cert.</div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRIVACY CALLOUT BANNER — below-fold */}
      <section className="cv-auto mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 to-slate-900/80 p-8 sm:p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Your Videos Never Touch Our Servers
          </h2>
          <p className="text-slate-200 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Unlike other video editors, Local AI Shorts Studio runs entirely in your browser using modern WebCodecs and local AI. No cloud storage, no account registration, no telemetry on your media.
          </p>
          <div className="pt-2">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Read our full Privacy Manifesto <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
