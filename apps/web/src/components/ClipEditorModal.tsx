'use client';

import React, { useState } from 'react';
import type { GeneratedClip } from '@shorts/shared';
import { SUBTITLE_THEMES, type SubtitleThemeId } from '@shorts/video-config';
import { X, Check, RefreshCw, Sliders, Type, Crop, Sparkles } from 'lucide-react';

interface ClipEditorModalProps {
  clip: GeneratedClip | null;
  onClose: () => void;
  onSave: (updatedClip: GeneratedClip) => void;
}

export function ClipEditorModal({ clip, onClose, onSave }: ClipEditorModalProps) {
  if (!clip) return null;

  const [hookText, setHookText] = useState(clip.selectedHook?.text || '');
  const [subtitleTheme, setSubtitleTheme] = useState<SubtitleThemeId>(
    (clip.subtitleThemeId as SubtitleThemeId) || 'bold-creator'
  );
  const [cropCenterX, setCropCenterX] = useState(50);
  const [isReRendering, setIsReRendering] = useState(false);

  const handleSave = () => {
    setIsReRendering(true);
    setTimeout(() => {
      setIsReRendering(false);
      onSave({
        ...clip,
        subtitleThemeId: subtitleTheme,
        selectedHook: {
          ...clip.selectedHook,
          text: hookText,
        },
      });
      onClose();
    }, 800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-800 bg-surface-100 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 id="editor-title" className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-brand-400" />
              <span>Customize Short #{clip.clipIndex}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Refine hook copy, adjust subtitle typography, and position framing center.
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

        {/* Hook text editor */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-brand-400" />
            <span>Opening Hook Headline</span>
          </label>
          <input
            type="text"
            value={hookText}
            onChange={(e) => setHookText(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-surface-200 px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Enter high-retention hook..."
          />
          {clip.alternativeHooks && clip.alternativeHooks.length > 0 && (
            <div className="pt-1 space-y-1">
              <span className="text-[11px] text-gray-400">AI Suggested Alternatives:</span>
              <div className="flex flex-wrap gap-1.5">
                {clip.alternativeHooks.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setHookText(alt.text)}
                    className="rounded-lg border border-gray-800 bg-surface-50 px-2.5 py-1 text-left text-[11px] text-gray-300 hover:border-brand-500 hover:text-white"
                  >
                    {alt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subtitle Theme Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
            <span>Subtitle Typography Style</span>
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
                      ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500'
                      : 'border-gray-800 bg-surface-200/50 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  <span className="font-semibold text-white">{theme.name}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                    {theme.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Framing Center X Reposition */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Crop className="h-3.5 w-3.5 text-emerald-400" />
              <span>Horizontal Crop Focal Center</span>
            </label>
            <span className="text-gray-400 font-mono">{cropCenterX}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            value={cropCenterX}
            onChange={(e) => setCropCenterX(Number(e.target.value))}
            className="w-full accent-brand-500 bg-gray-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Left Anchor</span>
            <span>Center (50%)</span>
            <span>Right Anchor</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-700 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isReRendering}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
          >
            {isReRendering ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Re-rendering Short...</span>
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
