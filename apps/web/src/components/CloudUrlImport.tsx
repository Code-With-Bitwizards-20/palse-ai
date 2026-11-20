'use client';

import React, { useState } from 'react';
import { Link2, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const SOCIAL_PATTERN = /(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com)/i;

interface CloudUrlImportProps {
  onImportReady: (url: string) => void;
  onError?: (msg: string) => void;
}

type ImportState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'social' }
  | { kind: 'valid'; url: string }
  | { kind: 'invalid'; reason: string };

export function CloudUrlImport({ onImportReady, onError }: CloudUrlImportProps) {
  const [url, setUrl] = useState('');
  const [importState, setImportState] = useState<ImportState>({ kind: 'idle' });

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Block social platform URLs immediately with clear messaging
    if (SOCIAL_PATTERN.test(trimmed)) {
      setImportState({ kind: 'social' });
      return;
    }

    setImportState({ kind: 'loading' });

    try {
      const res = await fetch('/api/url-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setImportState({ kind: 'valid', url: trimmed });
        onImportReady(trimmed);
      } else {
        const reason = data.reason ?? data.error ?? 'URL is not a valid direct video link.';
        setImportState({ kind: 'invalid', reason });
        onError?.(reason);
      }
    } catch {
      const reason = 'Network error while validating URL. Check your connection.';
      setImportState({ kind: 'invalid', reason });
      onError?.(reason);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleImport();
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setImportState({ kind: 'idle' }); }}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com/video.mp4"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
          />
        </div>
        <button
          onClick={handleImport}
          disabled={importState.kind === 'loading' || !url.trim()}
          className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-sm font-semibold text-white transition-all"
        >
          {importState.kind === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Import'
          )}
        </button>
      </div>

      {/* Feedback */}
      {importState.kind === 'social' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            YouTube, TikTok, and Instagram URLs cannot be imported directly due to platform restrictions.
            Please download your video and upload the file instead.
          </span>
        </div>
      )}

      {importState.kind === 'valid' && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="truncate">Valid video URL — ready to process.</span>
        </div>
      )}

      {importState.kind === 'invalid' && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-200">
          <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <span>{importState.reason}</span>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Enter a direct link to a video file (MP4, WebM, MOV). Social media links are not supported.
      </p>
    </div>
  );
}
