'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, XCircle, Clock, Cpu, Zap, AlertCircle } from 'lucide-react';

const STAGES = [
  'Queued',
  'Uploading',
  'Analyzing',
  'Transcribing',
  'Rendering',
  'Validating',
  'Complete',
] as const;

type Stage = (typeof STAGES)[number];

interface JobProgressEvent {
  jobId: string;
  status: string;
  stage: string;
  percent: number;
  startedAt?: string;
  hardware?: { encoderType: 'GPU' | 'CPU'; encoderName: string };
  clips?: any[];
  error?: string;
}

interface CloudJobStatusProps {
  jobId: string;
  onComplete: (clips: any[]) => void;
  onError: (msg: string) => void;
}

function useElapsed(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState('0s');
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      if (secs < 60) setElapsed(`${secs}s`);
      else setElapsed(`${Math.floor(secs / 60)}m ${secs % 60}s`);
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

export function CloudJobStatus({ jobId, onComplete, onError }: CloudJobStatusProps) {
  const [stage, setStage] = useState<string>('Queued');
  const [percent, setPercent] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [hardware, setHardware] = useState<{ encoderType: 'GPU' | 'CPU'; encoderName: string } | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const elapsed = useElapsed(startedAt);

  useEffect(() => {
    const es = new EventSource(`/api/jobs/${jobId}/events`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data: JobProgressEvent = JSON.parse(e.data);
        if (data.stage) setStage(data.stage);
        if (typeof data.percent === 'number') setPercent(data.percent);
        if (data.startedAt) setStartedAt(data.startedAt);
        if (data.hardware) setHardware(data.hardware);

        if (data.status === 'COMPLETE' || data.stage === 'Complete') {
          es.close();
          onComplete(data.clips ?? []);
        } else if (data.status === 'FAILED' || data.status === 'ERROR') {
          es.close();
          const msg = data.error ?? 'Processing failed';
          setErrorMsg(msg);
          onError(msg);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      const msg = 'Lost connection to job stream. Please refresh.';
      setErrorMsg(msg);
      onError(msg);
    };

    return () => es.close();
  }, [jobId, onComplete, onError]);

  async function handleCancel() {
    esRef.current?.close();
    setCancelled(true);
    try {
      await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
    } catch {
      // best-effort
    }
  }

  const stageIndex = STAGES.findIndex(
    (s) => s.toLowerCase() === stage.toLowerCase()
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {errorMsg || cancelled ? (
            <XCircle className="h-5 w-5 text-red-400" />
          ) : stageIndex === STAGES.length - 1 ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
          )}
          <span className="text-sm font-semibold text-white">
            {cancelled ? 'Cancelled' : errorMsg ? 'Failed' : stage}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {hardware && (
            <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 border border-slate-700 font-mono">
              {hardware.encoderType === 'GPU' ? (
                <Zap className="h-3 w-3 text-amber-400" />
              ) : (
                <Cpu className="h-3 w-3 text-blue-400" />
              )}
              Remote {hardware.encoderType}
            </span>
          )}
          {startedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {elapsed}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{stage}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-cyan transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Stage stepper */}
      <div className="flex items-center gap-0">
        {STAGES.map((s, i) => {
          const done = stageIndex > i;
          const active = stageIndex === i;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                    done
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : active
                      ? 'bg-brand-500/20 border-brand-500/60 text-brand-300 ring-2 ring-brand-500/30'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-[9px] font-medium hidden sm:block ${
                    done ? 'text-emerald-400' : active ? 'text-brand-300' : 'text-slate-500'
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 transition-all ${
                    done ? 'bg-emerald-500/50' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Cancel button */}
      {!cancelled && !errorMsg && stageIndex < STAGES.length - 1 && (
        <div className="flex justify-end">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            Cancel Job
          </button>
        </div>
      )}
    </div>
  );
}
