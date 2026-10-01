import React from 'react';
import Link from 'next/link';
import { Scissors, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Film } from 'lucide-react';

export const metadata = {
  title: 'AI Clipping Modes — Sequential Split & AI Highlights | ShortsEngine',
  description:
    'Discover Mode A (Exact Sequential Split) and Mode B (AI Highlights) with grounded Engagement Potential scoring and zero footage duplication.',
};

export default function AiClippingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Intelligent Video Division
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Two Powerful Clipping Modes
        </h1>
        <p className="text-sm sm:text-base text-gray-300">
          Whether you want every second preserved sequentially or wish to extract the highest
          engagement standalone highlights, ShortsEngine delivers exact results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mode A */}
        <div className="rounded-2xl border border-brand-500/30 bg-surface-100 p-8 space-y-5 relative overflow-hidden shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-lg bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold text-brand-300">
            <Scissors className="h-4 w-4" />
            <span>MODE A — DEFAULT STANDARD</span>
          </div>

          <h2 className="text-2xl font-bold text-white">Exact Sequential Split + AI Inside</h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Splits the entire video sequentially according to your selected duration (e.g.
            00:00–00:30, 00:30–01:00, 01:00–01:30). Every portion of the original video is
            retained.
          </p>

          <div className="space-y-2 border-t border-gray-800 pt-4 text-xs text-gray-400">
            <h4 className="font-semibold text-gray-200">AI Enhancement Inside Every Clip:</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>Smart 9:16 vertical reframe tracking active speaker</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>3 candidate content-grounded opening hooks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>Word-level karaoke subtitles burned in native ASS</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>Dynamic zoom punch-ins on keyword emphasis</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Mode B */}
        <div className="rounded-2xl border border-purple-500/30 bg-surface-100 p-8 space-y-5 relative overflow-hidden shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
            <Sparkles className="h-4 w-4" />
            <span>MODE B — AI CURATION</span>
          </div>

          <h2 className="text-2xl font-bold text-white">AI Highlights & Engagement Curation</h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Analyzes your entire long-form source to discover the strongest standalone moments,
            jokes, revelations, debates, and actionable takeaways.
          </p>

          <div className="space-y-2 border-t border-gray-800 pt-4 text-xs text-gray-400">
            <h4 className="font-semibold text-gray-200">Scoring Signals Evaluated:</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Idea completeness and clear narrative payoff</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Curiosity, debate, humor, and emotional intensity</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Audio energy spikes and minimal dead-air pauses</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Standalone audience context without missing backstory</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Engagement Potential Disclaimer Callout (Section 4 requirement) */}
      <div className="rounded-2xl border border-gray-800 bg-surface-200/50 p-6 flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-400">
        <ShieldCheck className="h-8 w-8 text-brand-400 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold text-white text-sm">Our Engagement Potential Principle</h4>
          <p>
            We strictly label scores as <strong>Engagement Potential</strong>. It is an AI estimate
            based on content, clarity, pacing, and editing characteristics. It does not guarantee
            views, algorithmic boosts, or virality. Trust and transparent engineering come first.
          </p>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-500/25 hover:bg-brand-600 transition-all"
        >
          <span>Choose Your Clipping Mode</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
