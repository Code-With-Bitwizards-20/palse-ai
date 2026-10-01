import React from 'react';
import { ShieldCheck, HardDrive, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Manifesto — 100% Client-Side Local AI Processing',
  description:
    'Our strict privacy architecture: original videos are never uploaded to servers, AI inference runs locally in your browser, and no video database exists.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10 text-slate-300 leading-relaxed">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          Strict Client-Side Media Guarantee
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Privacy Policy & Architecture Manifesto
        </h1>
        <p className="text-sm text-slate-400">Last Reviewed: {new Date().getFullYear()}</p>
      </div>

      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Lock className="h-5 w-5 text-emerald-400" />
          The Fundamental Rule: Zero Server Video Uploads
        </h2>
        <p className="text-sm text-emerald-200/90">
          When you select a video in Local AI Shorts Studio, your file remains entirely on your physical device. It is decoded, processed, reframed, transcribed, and rendered 100% inside your browser session using HTML5 WebCodecs, Canvas, and Web Workers.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-brand-400" />
          1. How AI Inference Runs Locally
        </h2>
        <p className="text-sm">
          Unlike traditional video tools that ship your audio and video streams to cloud transcription APIs (like OpenAI, Google, or Groq), Local AI Shorts Studio executes all models locally on your GPU/CPU via WebGPU and browser WASM:
        </p>
        <ul className="space-y-2 text-sm text-slate-300 pl-4 border-l-2 border-slate-800">
          <li>• Speech transcription runs via open quantized Whisper models in your browser.</li>
          <li>• Hook generation and topic extraction run via on-device LLMs or deterministic heuristics.</li>
          <li>• If open model weight files are downloaded from a public CDN/model repository, only the static neural network weights are downloaded into your browser cache. <strong>Your media content is never sent to any model host.</strong></li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-brand-400" />
          2. No Server Database & No Accounts
        </h2>
        <p className="text-sm">
          There are no user profiles, no database records, no cloud project persistence, and no cookies tracking your media. The web server merely distributes static HTML, CSS, and WebAssembly bundles via Vercel’s static CDN.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-brand-400" />
          3. Temporary Browser Cache & Storage Controls
        </h2>
        <p className="text-sm">
          Temporary frame buffers and exported blobs reside exclusively in volatile browser RAM or the Origin Private File System (OPFS). Closing the tab or clicking &ldquo;Clear Temporary Buffers&rdquo; instantly disposes of all media references.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. User Copyright & Ownership</h2>
        <p className="text-sm">
          You retain 100% exclusive copyright and commercial ownership of all source videos and output Shorts created using this tool. We do not claim any licensing rights over your creations.
        </p>
      </section>
    </div>
  );
}
