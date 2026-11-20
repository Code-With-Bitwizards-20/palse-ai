import React from 'react';
import Link from 'next/link';
import { Video, ShieldCheck, Cloud, Code2, Sparkles, ArrowRight, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About PulseCut AI — Cloud-Powered Video to Shorts Studio',
  description:
    'Learn about our cloud architecture: remote media workers, FFmpeg GPU pipelines, Whisper transcription, and secure short-lived video storage.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      <div className="space-y-4 text-center sm:text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Engineering Overview
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Cloud-Powered AI for Professional Short-Form Video
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          PulseCut AI is built on scalable cloud media workers that handle the heavy lifting — FFmpeg pipelines, GPU-accelerated encoding, Whisper transcription, and smart reframing — so you get professional Shorts without needing powerful local hardware.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <Cloud className="h-6 w-6 text-brand-400" />
          <h3 className="text-base font-bold text-white">Cloud Media Worker Pipeline</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Our remote workers use FFmpeg with hardware encoder detection (NVENC, QSV, AMF) to deliver GPU-accelerated 60 FPS encoding. Jobs are queued, isolated, and cleaned up automatically after 24 hours.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Secure &amp; Private by Design</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All uploads are encrypted in transit over TLS. Source files are automatically deleted after 24 hours. We do not sell or share your video data, and no permanent media database exists.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <Zap className="h-6 w-6 text-amber-400" />
          <h3 className="text-base font-bold text-white">Real-Time SSE Progress</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Jobs stream live progress events to the browser using Server-Sent Events. Watch your video move through Queued → Analyzing → Transcribing → Rendering → Complete in real time.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <Code2 className="h-6 w-6 text-brand-400" />
          <h3 className="text-base font-bold text-white">Platform-Optimized Output</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Output Shorts are calibrated with safe zones and metadata character limits for every major platform — YouTube Shorts, TikTok, Instagram Reels, and more.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Ready to create Shorts with cloud AI?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Upload your video and let our cloud workers do the work. No account required, no local hardware needed.
        </p>
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 py-3 text-xs font-bold text-white transition-all shadow-lg shadow-brand-500/20"
        >
          <Sparkles className="h-4 w-4" />
          <span>Launch PulseCut AI Studio</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
