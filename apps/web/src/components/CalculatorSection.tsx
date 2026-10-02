'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy-load CalculatorDemo: its JS is deferred until after the hero paints,
// keeping TBT and LCP low. This wrapper is a Client Component so that
// `ssr: false` is valid (Next.js 15 requires dynamic+ssr:false in client components).
const CalculatorDemoLazy = dynamic(
  () => import('@/components/CalculatorDemo').then((m) => ({ default: m.CalculatorDemo })),
  {
    ssr: false,
    loading: () => (
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-10 h-64 animate-pulse" />
      </section>
    ),
  }
);

export function CalculatorSection() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-10 h-64 animate-pulse" />
        </section>
      }
    >
      <CalculatorDemoLazy />
    </Suspense>
  );
}
