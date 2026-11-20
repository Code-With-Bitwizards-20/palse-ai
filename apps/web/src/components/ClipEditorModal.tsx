'use client';

import React, { useState } from 'react';
import type { GeneratedClip } from '@shorts/shared';
import { SUBTITLE_THEMES, type SubtitleThemeId } from '@shorts/video-config';
import {
  X,
  Check,
  RefreshCw,
  Sliders,
  Type,
  Crop,
  Sparkles,
  Clock,
  Layers,
  Film,
  Compass,
} from 'lucide-react';

interface ClipEditorModalProps {
  clip: GeneratedClip | null;
  maxSourceDuration?: number;
  onClose: () => void;
  onSave: (updatedClip: GeneratedClip) => void;
}

export function ClipEditorModal({
  clip,
  maxSourceDuration = 3600,
  onClose,
  onSave,
}: ClipEditorModalProps) {
  if (!clip) return null;

  const [startTime, setStartTime] = useState(clip.startTime);
  const [endTime, setEndTime] = useState(clip.endTime);
  const [hookText, setHookText] = useState(clip.selectedHook?.text || '');
  const [subtitleTheme, setSubtitleTheme] = useState<SubtitleThemeId>(
    (clip.subtitleThemeId as SubtitleThemeId) || 'bold-creator'
  );
  const [reframeStrategy, setReframeStrategy] = useState(clip.reframeStrategy || 'AI Smart');
  const [cropCenterX, setCropCenterX] = useState(50);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9' | '4:5'>('9:16');
  const [isReRendering, setIsReRendering] = useState(false);

  const duration = Math.max(1, Math.round((endTime - startTime) * 10) / 10);

  const handleStartTimeChange = (val: number) => {
    const clamped = Math.max(0, Math.min(val, endTime - 3));
    setStartTime(Math.round(clamped * 10) / 10);
  };

  const handleEndTimeChange = (val: number) => {
    const clamped = Math.min(maxSourceDuration, Math.max(val, startTime + 3));
    setEndTime(Math.round(clamped * 10) / 10);
  };

  const handleSave = () => {
    setIsReRendering(true);
    setTimeout(() => {
      setIsReRendering(false);
      onSave({
        ...clip,
        startTime,
        endTime,
        duration,
        subtitleThemeId: subtitleTheme,
        reframeStrategy,
        selectedHook: {
          ...clip.selectedHook,
          text: hookText,
        },
      });
      onClose();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 id="editor-title" className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-cyan-400" />
              <span>Customize Short #{clip.clipIndex}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Refine clip boundaries, aspect framing, subtitle theme, and hook headline.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. Timeline Start & End Trimming */}
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Clip Boundaries & Duration</span>
            </label>
            <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs font-mono font-bold text-cyan-400">
              {duration}s
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 mb-1 block">Start Time (seconds):</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={endTime - 3}
                value={startTime}
                onChange={(e) => handleStartTimeChange(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 mb-1 block">End Time (seconds):</label>
              <input
                type="number"
                step="0.5"
                min={startTime + 3}
                max={maxSourceDuration}
                value={endTime}
                onChange={(e) => handleEndTimeChange(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Target Aspect Ratio & Framing Strategy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-purple-400" />
              <span>Target Aspect Ratio</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['9:16', '1:1', '16:9', '4:5'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`rounded-lg py-2 text-xs font-bold transition-all ${
                    aspectRatio === ratio
                      ? 'bg-purple-600 text-white ring-1 ring-purple-400 shadow-md'
                      : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>Reframing Strategy</span>
            </label>
            <select
              value={reframeStrategy}
              onChange={(e) => setReframeStrategy(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="AI Smart">AI Smart Dynamic Panning</option>
              <option value="Center">Center Fixed Crop</option>
              <option value="Gameplay">Gameplay / GTA HUD Focus</option>
              <option value="Face Focus">Face / Speaker Focus</option>
              <option value="Fit + Blur">Fit + Blurred Letterbox</option>
              <option value="Manual">Manual Pan Center</option>
            </select>
          </div>
        </div>

        {/* 3. Opening Hook Headline */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-cyan-400" />
            <span>Opening Hook Headline</span>
          </label>
          <input
            type="text"
            value={hookText}
            onChange={(e) => setHookText(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            placeholder="Enter high-retention hook headline..."
          />
          {clip.alternativeHooks && clip.alternativeHooks.length > 0 && (
            <div className="pt-1 space-y-1">
              <span className="text-[11px] text-slate-400">AI Suggested Alternatives:</span>
              <div className="flex flex-wrap gap-1.5">
                {clip.alternativeHooks.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setHookText(alt.text)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-left text-[11px] text-slate-300 hover:border-cyan-500 hover:text-white transition-colors"
                  >
                    {alt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Subtitle Theme Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Subtitle Typography Theme</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(SUBTITLE_THEMES).map((theme) => {
              const isSelected = subtitleTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSubtitleTheme(theme.id)}
                  className={`flex flex-col text-left rounded-xl p-2.5 border transition-all text-xs ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/15 text-white ring-1 ring-cyan-500'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="font-semibold text-white">{theme.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {theme.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Horizontal Focal Center (Pan) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Crop className="h-3.5 w-3.5 text-emerald-400" />
              <span>Horizontal Crop Focal Center</span>
            </label>
            <span className="text-slate-400 font-mono">{cropCenterX}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            value={cropCenterX}
            onChange={(e) => setCropCenterX(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Left (10%)</span>
            <span>Center (50%)</span>
            <span>Right (90%)</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isReRendering}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 transition-all"
          >
            {isReRendering ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Updating Short...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Apply & Update Short</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
