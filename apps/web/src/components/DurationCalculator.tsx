'use client';

import React from 'react';
import { calculateClips, formatDuration, type RemainderStrategy } from '@shorts/shared';
import { Clock, Scissors, AlertCircle, Info } from 'lucide-react';

interface DurationCalculatorProps {
  sourceDurationSeconds: number; // e.g. 300
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  remainderStrategy: RemainderStrategy;
  onStrategyChange: (strategy: RemainderStrategy) => void;
}

const PRESET_DURATIONS = [15, 20, 30, 45, 60, 90, 120, 180];

export function DurationCalculator({
  sourceDurationSeconds,
  selectedDuration,
  onDurationChange,
  remainderStrategy,
  onStrategyChange,
}: DurationCalculatorProps) {
  const calculation = calculateClips(
    Math.max(1, sourceDurationSeconds),
    selectedDuration,
    remainderStrategy
  );

  const hasRemainder = calculation.remainder > 0;

  return (
    <div className="space-y-6 rounded-2xl border border-gray-800 bg-surface-100/60 p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-400" />
            <span>Short Duration Control</span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Select target length per Short. Math updates live with zero footage drift.
          </p>
        </div>
        <span className="inline-flex items-center rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-400 border border-brand-500/20 self-start sm:self-auto">
          {selectedDuration} seconds
        </span>
      </div>

      {/* Quick Preset Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-300">Quick Duration Presets</label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {PRESET_DURATIONS.map((preset) => {
            const isSelected = selectedDuration === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onDurationChange(preset)}
                className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 ring-2 ring-brand-400/50'
                    : 'bg-surface-50 text-gray-300 hover:bg-gray-800 hover:text-white border border-gray-800'
                }`}
              >
                <span>{preset}s</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration Slider */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between text-xs text-slate-300">
          <span>10 seconds (Micro-hook)</span>
          <span className="font-semibold text-brand-400">{selectedDuration}s</span>
          <span>180 seconds (3 min deep dive)</span>
        </div>
        <input
          type="range"
          min={10}
          max={180}
          step={5}
          value={selectedDuration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-800 accent-brand-500"
          aria-label="Adjust Short duration in seconds"
        />
      </div>

      {/* Live Calculation Display (Section 5 requirements) */}
      <div className="rounded-xl border border-gray-800/80 bg-surface-200/80 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
          <Scissors className="h-3.5 w-3.5 text-accent-cyan" />
          <span>Live Calculation Breakdown</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
          <div className="rounded-lg bg-surface-100 p-2.5 border border-gray-800">
            <span className="block text-[11px] text-slate-300">Source</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {formatDuration(sourceDurationSeconds)}
            </span>
          </div>

          <div className="rounded-lg bg-surface-100 p-2.5 border border-gray-800">
            <span className="block text-[11px] text-slate-300">Selected</span>
            <span className="text-sm font-bold text-brand-400 font-mono mt-0.5 block">
              {formatDuration(selectedDuration)}
            </span>
          </div>

          <div className="rounded-lg bg-surface-100 p-2.5 border border-gray-800">
            <span className="block text-[11px] text-slate-300">Full Shorts</span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
              {calculation.fullClipCount}
            </span>
          </div>

          <div className="rounded-lg bg-surface-100 p-2.5 border border-gray-800">
            <span className="block text-[11px] text-slate-300">Remaining</span>
            <span
              className={`text-sm font-bold font-mono mt-0.5 block ${
                hasRemainder ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {formatDuration(calculation.remainder)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-lg bg-brand-500/10 p-2.5 border border-brand-500/30">
            <span className="block text-[11px] text-brand-300">Estimated outputs</span>
            <span className="text-sm font-bold text-brand-300 font-mono mt-0.5 block">
              {calculation.estimatedOutputs} Shorts
            </span>
          </div>
        </div>
      </div>

      {/* Remainder Handling Section (Section 1 requirement) */}
      {hasRemainder && (
        <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <h4 className="text-xs font-semibold text-amber-300">
              Handle leftover footage ({formatDuration(calculation.remainder)} remaining)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label
              className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                remainderStrategy === 'ignore'
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-gray-800 bg-surface-100 text-slate-300 hover:text-white'
              }`}
            >
              <input
                type="radio"
                name="remainderStrategy"
                value="ignore"
                checked={remainderStrategy === 'ignore'}
                onChange={() => onStrategyChange('ignore')}
                className="mt-0.5 text-brand-500 focus:ring-0"
              />
              <div>
                <span className="font-semibold block text-gray-200">1. Ignore remainder</span>
                <span className="text-[11px] text-slate-300 block mt-0.5">
                  Discard last {calculation.remainder}s to keep only exact {selectedDuration}s clips.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                remainderStrategy === 'shorter-final'
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-gray-800 bg-surface-100 text-slate-300 hover:text-white'
              }`}
            >
              <input
                type="radio"
                name="remainderStrategy"
                value="shorter-final"
                checked={remainderStrategy === 'shorter-final'}
                onChange={() => onStrategyChange('shorter-final')}
                className="mt-0.5 text-brand-500 focus:ring-0"
              />
              <div>
                <span className="font-semibold block text-gray-200">
                  2. Generate one shorter final clip
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5">
                  Produce full clips + 1 final Short lasting {calculation.remainder}s.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                remainderStrategy === 'redistribute'
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-gray-800 bg-surface-100 text-slate-300 hover:text-white'
              }`}
            >
              <input
                type="radio"
                name="remainderStrategy"
                value="redistribute"
                checked={remainderStrategy === 'redistribute'}
                onChange={() => onStrategyChange('redistribute')}
                className="mt-0.5 text-brand-500 focus:ring-0"
              />
              <div>
                <span className="font-semibold block text-gray-200">
                  3. Smartly redistribute boundaries
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5">
                  Evenly expand/contract boundaries to absorb remainder without loss.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                remainderStrategy === 'controlled-overlap'
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-gray-800 bg-surface-100 text-slate-300 hover:text-white'
              }`}
            >
              <input
                type="radio"
                name="remainderStrategy"
                value="controlled-overlap"
                checked={remainderStrategy === 'controlled-overlap'}
                onChange={() => onStrategyChange('controlled-overlap')}
                className="mt-0.5 text-brand-500 focus:ring-0"
              />
              <div>
                <span className="font-semibold block text-gray-200">
                  4. Controlled overlap clip
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5">
                  Add 1 extra full-length clip anchored to video end (clearly tagged).
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 pt-1">
            <Info className="h-3.5 w-3.5 text-brand-400 shrink-0" />
            <span>
              ShortsEngine never silently duplicates footage. Boundaries are mathematically exact.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
