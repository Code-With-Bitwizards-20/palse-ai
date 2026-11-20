'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Check if error is due to stale chunk caching
    const msg = error?.message || '';
    if (
      msg.includes('Loading chunk') ||
      msg.includes("reading 'call'") ||
      msg.includes('Cannot find module')
    ) {
      // Automatic recovery: reload once to fetch fresh assets
      const hasReloaded = sessionStorage.getItem('chunk_reload_attempted');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload_attempted', '1');
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 text-2xl font-bold">
        ⚠️
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-slate-400 max-w-md mb-6 text-sm">
        A client runtime error occurred while loading this page. This often happens if the application was recently updated.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            sessionStorage.removeItem('chunk_reload_attempted');
            reset();
          }}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all border border-slate-700"
        >
          Try Again
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem('chunk_reload_attempted');
            window.location.reload();
          }}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition-all shadow-lg shadow-cyan-500/20"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
