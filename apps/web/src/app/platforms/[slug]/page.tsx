import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLATFORM_PRESETS, type PlatformId } from '@shorts/platform-presets';
import { Video, CheckCircle2, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export async function generateStaticParams() {
  return Object.keys(PLATFORM_PRESETS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const preset = PLATFORM_PRESETS[slug as PlatformId];
  if (!preset) return { title: 'Platform Not Found | ShortsEngine' };

  return {
    title: `${preset.name} Video Specs & Safe Zones (60 FPS) | ShortsEngine`,
    description: `Official ${preset.name} aspect ratios, maximum dimensions, UI safe margins, and 60 FPS CFR rendering requirements.`,
  };
}

export default async function PlatformDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const preset = PLATFORM_PRESETS[slug as PlatformId];

  if (!preset) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-400">
          <Video className="h-3.5 w-3.5" />
          <span>Platform Specifications</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {preset.name} Video Specs & Safe Zones
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-3xl leading-relaxed">
          {preset.tagline} ShortsEngine automatically aligns subtitles, hooks, and subject crops
          strictly within these boundaries.
        </p>
      </div>

      {/* Technical Specifications Table */}
      <div className="rounded-2xl border border-gray-800 bg-surface-100 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-gray-800 bg-surface-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Rendering Parameters & Limits
          </h2>
          <span className="font-mono text-xs text-emerald-400">
            Target: {preset.targetFrameRate} FPS CFR
          </span>
        </div>

        <div className="divide-y divide-gray-800/80 text-xs font-mono">
          <div className="grid grid-cols-2 p-4">
            <span className="text-gray-400 font-sans">Recommended Aspect Ratio</span>
            <span className="text-white font-bold">{preset.recommendedAspectRatio} Vertical</span>
          </div>

          <div className="grid grid-cols-2 p-4">
            <span className="text-gray-400 font-sans">Preferred Dimensions</span>
            <span className="text-white font-bold">
              {preset.preferredDimensions.width} × {preset.preferredDimensions.height} px
            </span>
          </div>

          <div className="grid grid-cols-2 p-4">
            <span className="text-gray-400 font-sans">Top Header Safe Zone Margin</span>
            <span className="text-amber-400 font-bold">{preset.uiSafeZone.topPercent}% from top</span>
          </div>

          <div className="grid grid-cols-2 p-4">
            <span className="text-gray-400 font-sans">Bottom UI Safe Zone Margin</span>
            <span className="text-amber-400 font-bold">
              {preset.uiSafeZone.bottomPercent}% from bottom
            </span>
          </div>

          <div className="grid grid-cols-2 p-4">
            <span className="text-gray-400 font-sans">Right Buttons Margin</span>
            <span className="text-amber-400 font-bold">
              {preset.uiSafeZone.rightPercent}% from right edge
            </span>
          </div>

          <div className="grid grid-cols-2 p-4">
            <span className="text-gray-400 font-sans">Encoding Profile</span>
            <span className="text-white font-bold">
              {preset.recommendedCodec.toUpperCase()} / {preset.pixelFormat} / faststart MP4
            </span>
          </div>

          <div className="grid grid-cols-2 p-4">
            <span className="text-gray-400 font-sans">Audio Specification</span>
            <span className="text-white font-bold">
              {preset.audioCodec.toUpperCase()} @ {preset.audioBitrateKbps}kbps,{' '}
              {preset.audioSampleRate}Hz
            </span>
          </div>

          <div className="grid grid-cols-2 p-4">
            <span className="text-gray-400 font-sans">Character Limit</span>
            <span className="text-white font-bold">
              {preset.metadataConstraints.characterLimitTotal} characters
            </span>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="rounded-2xl border border-gray-800 bg-surface-200/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Generate {preset.name} Shorts Now</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Auto-conformed with karaoke captions and safe-zone positioning.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-all shrink-0"
        >
          <span>Open Wizard</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
