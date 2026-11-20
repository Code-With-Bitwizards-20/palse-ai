import React from 'react';
import { ShieldCheck, Cloud, Lock, CheckCircle2, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — PulseCut AI Cloud Processing',
  description:
    'How PulseCut AI handles your video data: secure cloud processing, 24-hour file deletion, TLS encryption, and no data sharing.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10 text-slate-300 leading-relaxed">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-3.5 py-1 text-xs font-semibold text-brand-400">
          <ShieldCheck className="h-4 w-4" />
          Cloud Processing Privacy Policy
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Privacy Policy &amp; Data Handling
        </h1>
        <p className="text-sm text-slate-400">Last Reviewed: {new Date().getFullYear()}</p>
      </div>

      <div className="rounded-2xl border border-brand-500/30 bg-brand-950/20 p-6 space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cloud className="h-5 w-5 text-brand-400" />
          How Your Video Is Processed
        </h2>
        <p className="text-sm text-brand-200/90">
          When you upload a video to PulseCut AI, your file is securely transmitted to our cloud workers over an encrypted TLS connection. Processing — including transcription, reframing, caption generation, and rendering — happens on our secure remote infrastructure.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock className="h-5 w-5 text-brand-400" />
          1. Secure Cloud Processing
        </h2>
        <p className="text-sm">
          Your uploaded videos are processed on our secure cloud workers. We use isolated job environments so no video data is shared between users. All AI inference — including transcription, hook generation, and reframing — runs on our controlled server infrastructure:
        </p>
        <ul className="space-y-2 text-sm text-slate-300 pl-4 border-l-2 border-slate-800">
          <li>• All uploads are encrypted in transit using TLS.</li>
          <li>• Source video files are stored only for the duration of processing.</li>
          <li>• Source files are automatically deleted after 24 hours.</li>
          <li>• Completed clips are available for download for 48 hours, then permanently deleted.</li>
          <li>• We do not sell or share your video data with any third parties.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-brand-400" />
          2. Data Retention &amp; Deletion
        </h2>
        <p className="text-sm">
          We operate a strict short-lived data policy:
        </p>
        <ul className="space-y-2 text-sm text-slate-300 pl-4 border-l-2 border-slate-800">
          <li>• Source video files are automatically deleted after <strong>24 hours</strong> from upload.</li>
          <li>• Completed output clips and subtitle files are automatically deleted after <strong>48 hours</strong> from job completion.</li>
          <li>• No permanent video database exists — there is no long-term storage of your media.</li>
          <li>• No user accounts are required, and we do not store personal profiles linked to your uploads.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-brand-400" />
          3. No Data Selling or Sharing
        </h2>
        <p className="text-sm">
          We do not sell, rent, or share your video content or any derived data with advertisers, data brokers, or other third parties. Your video content is used solely to perform the processing job you requested.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. User Copyright &amp; Ownership</h2>
        <p className="text-sm">
          You retain 100% exclusive copyright and commercial ownership of all source videos and output Shorts created using this tool. We do not claim any licensing rights over your creations.
        </p>
      </section>
    </div>
  );
}
