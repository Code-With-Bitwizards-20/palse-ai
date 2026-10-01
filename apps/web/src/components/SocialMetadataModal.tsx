'use client';

import React, { useState } from 'react';
import type { GeneratedClip } from '@shorts/shared';
import { PLATFORM_PRESETS, type PlatformId } from '@shorts/platform-presets';
import { X, Copy, Check, Share2, Sparkles, Tag, Clock } from 'lucide-react';

interface SocialMetadataModalProps {
  clip: GeneratedClip | null;
  onClose: () => void;
}

export function SocialMetadataModal({ clip, onClose }: SocialMetadataModalProps) {
  const [activePlatform, setActivePlatform] = useState<PlatformId>('youtube-shorts');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!clip) return null;

  const metadata = clip.socialMetadata?.[activePlatform];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const platforms: PlatformId[] = [
    'youtube-shorts',
    'tiktok',
    'instagram-reels',
    'facebook-reels',
    'x',
    'threads',
    'universal',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-gray-800 bg-surface-100 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 id="social-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="h-5 w-5 text-accent-cyan" />
              <span>Platform-Optimized Social Copy & Metadata</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Grounded, non-spammy copy formatted to specific platform safe boundaries and limits.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-800/80 pb-3">
          {platforms.map((pid) => {
            const preset = PLATFORM_PRESETS[pid];
            const isSelected = activePlatform === pid;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => setActivePlatform(pid)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'bg-surface-50 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {metadata ? (
          <div className="space-y-4">
            {/* Title / Headline */}
            <div className="space-y-1.5 rounded-xl border border-gray-800 bg-surface-200/70 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">Title / Hook Headline</span>
                <button
                  onClick={() => handleCopy(metadata.title, 'title')}
                  className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300"
                >
                  {copiedKey === 'title' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-medium text-white font-mono bg-surface-100 p-2.5 rounded-lg border border-gray-800">
                {metadata.title}
              </p>
            </div>

            {/* Caption / Description */}
            <div className="space-y-1.5 rounded-xl border border-gray-800 bg-surface-200/70 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">Caption & Posting Text</span>
                <button
                  onClick={() => handleCopy(metadata.caption, 'caption')}
                  className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300"
                >
                  {copiedKey === 'caption' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-200 font-sans whitespace-pre-line bg-surface-100 p-3 rounded-lg border border-gray-800 leading-relaxed">
                {metadata.caption}
              </p>
            </div>

            {/* Quick Meta Row (CTA, Cover Timestamp, Hashtags) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-gray-800 bg-surface-200/70 p-3">
                <span className="text-gray-400 flex items-center gap-1 text-[11px] mb-1">
                  <Tag className="h-3.5 w-3.5 text-accent-cyan" />
                  <span>Hashtags</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {metadata.hashtags.map((h, i) => (
                    <span
                      key={i}
                      className="rounded bg-surface-50 px-1.5 py-0.5 text-[10px] text-brand-300 font-mono"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-surface-200/70 p-3">
                <span className="text-gray-400 flex items-center gap-1 text-[11px] mb-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Suggested Cover Frame</span>
                </span>
                <span className="font-mono text-white text-sm">
                  {metadata.suggestedCoverTimestamp}s timestamp
                </span>
              </div>

              <div className="rounded-xl border border-gray-800 bg-surface-200/70 p-3">
                <span className="text-gray-400 flex items-center gap-1 text-[11px] mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-accent-amber" />
                  <span>Thumbnail Text</span>
                </span>
                <span className="font-semibold text-white text-xs block truncate">
                  {metadata.thumbnailText}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-400">
            No metadata generated for this platform.
          </div>
        )}

        <div className="flex justify-end border-t border-gray-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-surface-50 border border-gray-700 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
