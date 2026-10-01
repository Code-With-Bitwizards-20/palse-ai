import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Maximize2,
  Zap,
  Type,
  Sliders,
  Volume2,
  FileCheck,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'Features — AI Smart Reframing, 60 FPS Conform & Subtitles | ShortsEngine',
  description:
    'Explore the deep media processing features of ShortsEngine: smart reframing, 60 FPS motion compensation, karaoke subtitles, and audio loudness normalization.',
};

export default function FeaturesPage() {
  const features = [
    {
      icon: Maximize2,
      title: 'AI Smart Reframing & Crop Smoothing',
      description:
        'Converts 16:9 widescreen or arbitrary aspect ratios into 9:16 vertical without sudden camera jumps. Tracks speaker movement with exponential moving average (EMA) smoothing and offers blurred background fallbacks.',
    },
    {
      icon: Zap,
      title: '60 FPS CFR Motion Engine',
      description:
        'Conforms all output variants to strict 60 FPS Constant Frame Rate. Detects native frame rates and applies motion-compensated interpolation with hard-cut protection when source FPS is below 60.',
    },
    {
      icon: Type,
      title: 'Word-Level Karaoke Subtitle Engine',
      description:
        'Advanced SubStation Alpha (.ass) generator with word-level timing tags. Highlights words as they are pronounced, avoiding UI safe zones across TikTok and Reels.',
    },
    {
      icon: Sliders,
      title: 'Adaptive Editing & Zoom Dynamics',
      description:
        'Configurable pacing from Clean Dialogue to Extreme High Energy. Applies subtle punch zooms on keyword emphasis and trims dead-air pauses without distorting speaker cadence.',
    },
    {
      icon: Volume2,
      title: 'Audio Sweetening & EBU R128 Normalization',
      description:
        'Professional loudness normalization (-14 LUFS, -1.5 dBTP peak protection) with voice clarity enhancement, dynamic music ducking, and noise attenuation.',
    },
    {
      icon: FileCheck,
      title: 'Post-Render ffprobe Validation',
      description:
        'Guarantees output integrity before presenting downloads. Verifies exact dimensions, audio/video stream presence, non-zero file sizes, and duration alignment.',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Core Capabilities
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Engineered for Media Precision
        </h1>
        <p className="text-sm sm:text-base text-gray-300">
          Every component in ShortsEngine is built on native FFmpeg 9.0 pipelines and grounded AI
          analysis. Zero fake progress bars or mockups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-gray-800 bg-surface-100 p-6 space-y-3.5 hover:border-brand-500/40 transition-colors"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-gray-800 bg-surface-200/50 p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Experience Genuine Media Processing</h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
          Start converting your long-form videos with full control over duration, aspect ratios, and
          typography styles.
        </p>
        <Link
          href="/shorts-editor"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-xs font-bold text-white hover:bg-brand-600 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Launch Local Shorts Studio</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
