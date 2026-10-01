'use client';

import React from 'react';
import { PLATFORM_PRESETS, type PlatformId } from '@shorts/platform-presets';

interface SafeZoneOverlayProps {
  platformId: PlatformId;
  visible: boolean;
}

export function SafeZoneOverlay({ platformId, visible }: SafeZoneOverlayProps) {
  if (!visible) return null;

  const preset = PLATFORM_PRESETS[platformId] || PLATFORM_PRESETS.universal;
  const { uiSafeZone, subtitleSafeZone, hookSafeZone } = preset;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden font-mono text-[10px]"
      aria-hidden="true"
    >
      {/* Top Header UI Unsafe Area */}
      <div
        style={{ height: `${uiSafeZone.topPercent}%` }}
        className="w-full bg-red-500/20 border-b border-dashed border-red-400 flex items-center justify-center text-red-300 backdrop-blur-[1px]"
      >
        <span className="bg-red-950/80 px-2 py-0.5 rounded">
          {preset.name} Top UI Safe Zone ({uiSafeZone.topPercent}%)
        </span>
      </div>

      {/* Center Content Area */}
      <div className="relative flex-1" style={{ height: `${100 - uiSafeZone.topPercent - uiSafeZone.bottomPercent}%` }}>
        {/* Right Buttons Unsafe Area (Like, Comments, Share) */}
        <div
          style={{ width: `${uiSafeZone.rightPercent}%` }}
          className="absolute right-0 top-0 bottom-0 bg-red-500/15 border-l border-dashed border-red-400 flex flex-col items-center justify-center text-red-300"
        >
          <span className="rotate-90 whitespace-nowrap bg-red-950/80 px-1 py-0.5 rounded">
            Actions Safe Zone ({uiSafeZone.rightPercent}%)
          </span>
        </div>

        {/* Hook Safe Box */}
        <div
          style={{
            top: `${hookSafeZone.topPercent}%`,
            left: `${hookSafeZone.leftPercent}%`,
            right: `${hookSafeZone.rightPercent}%`,
            height: '18%',
          }}
          className="absolute border border-brand-400/60 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-300"
        >
          <span className="bg-surface-glass px-1.5 py-0.5 rounded">Hook Safe Zone</span>
        </div>

        {/* Subtitles Safe Box */}
        <div
          style={{
            bottom: '4%',
            left: `${subtitleSafeZone.leftPercent}%`,
            right: `${subtitleSafeZone.rightPercent}%`,
            height: '24%',
          }}
          className="absolute border border-emerald-400/60 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-300"
        >
          <span className="bg-surface-glass px-1.5 py-0.5 rounded">Captions Safe Zone</span>
        </div>
      </div>

      {/* Bottom Profile & Caption UI Unsafe Area */}
      <div
        style={{ height: `${uiSafeZone.bottomPercent}%` }}
        className="absolute bottom-0 w-full bg-red-500/20 border-t border-dashed border-red-400 flex items-center justify-center text-red-300 backdrop-blur-[1px]"
      >
        <span className="bg-red-950/80 px-2 py-0.5 rounded">
          {preset.name} Bottom Caption / Audio Safe Zone ({uiSafeZone.bottomPercent}%)
        </span>
      </div>
    </div>
  );
}
