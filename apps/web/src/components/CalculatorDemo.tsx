'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DurationCalculator } from '@/components/DurationCalculator';
import type { RemainderStrategy } from '@shorts/shared';
import { Sliders, ArrowRight } from 'lucide-react';

export function CalculatorDemo() {
  const [demoDuration, setDemoDuration] = useState(30);
  const [demoStrategy, setDemoStrategy] = useState<RemainderStrategy>('ignore');

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-10 backdrop-blur-md shadow-2xl">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-300">
            <Sliders className="h-3.5 w-3.5 text-brand-400" />
            <span>Exact Mathematical Split Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Test Exact Clip Timeline Math
          </h2>
          <p className="text-sm text-slate-300">
            Slide target duration to see how a sample 5-minute (300-second) video splits mathematically into exact Shorts.
          </p>
        </div>

        <DurationCalculator
          sourceDurationSeconds={300}
          selectedDuration={demoDuration}
          onDurationChange={(d) => setDemoDuration(d)}
          remainderStrategy={demoStrategy}
          onStrategyChange={(s) => setDemoStrategy(s)}
        />

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-300">
            Formula: <code className="text-brand-300 font-mono">fullClips = floor(300 / {demoDuration})</code>
          </div>
          <Link
            href="/studio"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            Open Studio with Your Video <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
