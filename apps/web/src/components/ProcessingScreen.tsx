'use client';

import React, { useEffect, useState } from 'react';
import { PIPELINE_STAGES, type JobProgressEvent, type JobStage } from '@shorts/shared';
import { CheckCircle2, Loader2, AlertTriangle, RefreshCw, Sparkles, Video } from 'lucide-react';

interface ProcessingScreenProps {
  projectId: string;
  onComplete: () => void;
}

export function ProcessingScreen({ projectId, onComplete }: ProcessingScreenProps) {
  const [currentEvent, setCurrentEvent] = useState<JobProgressEvent>({
    jobId: '',
    projectId,
    stage: 'UPLOADING',
    stageLabel: 'Initializing processing pipeline...',
    percent: 3,
    timestamp: new Date().toISOString(),
  });

  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Connect to live Server-Sent Events stream
    const eventSource = new EventSource(`/api/projects/${projectId}/events`);

    eventSource.onmessage = (e) => {
      try {
        const data: JobProgressEvent = JSON.parse(e.data);
        setCurrentEvent(data);

        if (data.stage === 'COMPLETED' || data.percent >= 100) {
          eventSource.close();
          setTimeout(() => onComplete(), 1200);
        }

        if (data.stage === 'FAILED') {
          setHasError(true);
          setErrorMessage(data.errorMessage || 'An error occurred during video processing.');
          eventSource.close();
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE connection closed or lost:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [projectId, onComplete]);

  const handleRetry = async () => {
    setHasError(false);
    setErrorMessage('');
    try {
      await fetch(`/api/projects/${projectId}/process`, { method: 'POST' });
      window.location.reload();
    } catch (e: any) {
      setHasError(true);
      setErrorMessage(e.message);
    }
  };

  const getStageStatus = (stage: JobStage) => {
    const stageIdx = PIPELINE_STAGES.findIndex((s) => s.stage === stage);
    const currentIdx = PIPELINE_STAGES.findIndex((s) => s.stage === currentEvent.stage);

    if (currentEvent.stage === 'COMPLETED' || stageIdx < currentIdx) {
      return 'completed';
    }
    if (stageIdx === currentIdx) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Real-Time Neural Video Pipeline</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Crafting Your Social Shorts
        </h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Every Short is sequentially inspected, transcribed, reframed to 9:16, fitted with
          karaoke captions, and conformed to 60 FPS CFR.
        </p>
      </div>

      {/* Main Progress Card */}
      <div className="rounded-2xl border border-gray-800 bg-surface-100 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Glowing Progress bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-white flex items-center gap-2">
              {!hasError && <Loader2 className="h-4 w-4 animate-spin text-brand-400" />}
              <span>{currentEvent.stageLabel}</span>
            </span>
            <span className="font-mono text-base font-bold text-brand-400">
              {Math.min(100, Math.max(0, currentEvent.percent))}%
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-gray-800/80 overflow-hidden relative p-0.5">
            <div
              style={{ width: `${Math.min(100, Math.max(3, currentEvent.percent))}%` }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-400 to-accent-cyan transition-all duration-300 shadow-lg shadow-brand-500/50"
            />
          </div>

          {currentEvent.totalClips && currentEvent.currentClipIndex && (
            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span className="flex items-center gap-1.5 text-gray-300">
                <Video className="h-3.5 w-3.5 text-brand-400" />
                <span>
                  Processing Short{' '}
                  <strong className="text-white">{currentEvent.currentClipIndex}</strong> of{' '}
                  <strong className="text-white">{currentEvent.totalClips}</strong>
                </span>
              </span>
              <span>Conforming 60 FPS CFR & libass captions</span>
            </div>
          )}
        </div>

        {/* Error State */}
        {hasError && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-300 font-semibold text-sm">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <span>Pipeline Interrupted</span>
            </div>
            <p className="text-xs text-red-200/80">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-red-500 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Processing Job</span>
            </button>
          </div>
        )}

        {/* Pipeline Stage Checkpoints Grid */}
        <div className="mt-8 border-t border-gray-800 pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Pipeline Stages & Verification
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {PIPELINE_STAGES.map((s, idx) => {
              const status = getStageStatus(s.stage);
              return (
                <div
                  key={s.stage}
                  className={`flex items-center gap-2.5 rounded-lg p-2 text-xs transition-colors border ${
                    status === 'completed'
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-gray-200'
                      : status === 'active'
                        ? 'border-brand-500/60 bg-brand-500/10 text-white font-medium shadow-sm'
                        : 'border-gray-800/60 bg-surface-200/40 text-gray-500'
                  }`}
                >
                  <div className="shrink-0">
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : status === 'active' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-700 text-[9px] text-gray-500">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
