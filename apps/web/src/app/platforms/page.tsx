import React from 'react';
import Link from 'next/link';
import { PLATFORM_PRESETS } from '@shorts/platform-presets';
import { Video, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

export const metadata = {
  title: 'Social Platform Presets & Safe Zones | ShortsEngine',
  description:
    'Dedicated safe zone guidelines and rendering specifications for YouTube Shorts, TikTok, Instagram Reels, Facebook Reels, X, and Threads.',
};

export default function PlatformsIndexPage() {
  const presets = Object.values(PLATFORM_PRESETS);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Targeted Distribution
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Social Platform Presets
        </h1>
        <p className="text-sm sm:text-base text-gray-300">
          Platform safe zones and interface bounds change continuously. Our centralized preset
          system ensures your captions, hooks, and faces never get covered by app buttons.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="flex flex-col rounded-2xl border border-gray-800 bg-surface-100 p-6 space-y-4 hover:border-brand-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-200 text-brand-400 border border-gray-700">
                <Video className="h-5 w-5" />
              </div>
              <span className="rounded-lg bg-surface-200 px-2 py-0.5 font-mono text-[11px] text-gray-300 border border-gray-800">
                {preset.recommendedAspectRatio}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-white text-base">{preset.name}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{preset.tagline}</p>
            </div>

            <div className="space-y-1.5 text-xs text-gray-400 border-t border-gray-800/80 pt-3 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Preferred:</span>
                <span className="text-gray-200">
                  {preset.preferredDimensions.width}×{preset.preferredDimensions.height}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Top Safe Margin:</span>
                <span className="text-gray-200">{preset.uiSafeZone.topPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Bottom Safe Margin:</span>
                <span className="text-gray-200">{preset.uiSafeZone.bottomPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Target FPS:</span>
                <span className="text-emerald-400 font-bold">{preset.targetFrameRate} FPS CFR</span>
              </div>
            </div>

            <div className="pt-2 mt-auto">
              <Link
                href={`/platforms/${preset.id}`}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-700 bg-surface-50 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <span>View Safe Zone Guide</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
