'use client';

import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, XCircle, X } from 'lucide-react';

const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/x-msvideo'];
const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

interface UploadResult {
  filePath: string;
  jobId: string;
}

interface CloudUploadDropzoneProps {
  onUploadComplete: (result: UploadResult) => void;
  onError: (msg: string) => void;
}

type State =
  | { kind: 'idle' }
  | { kind: 'uploading'; file: File; percent: number; speed: number }
  | { kind: 'success'; file: File; result: UploadResult }
  | { kind: 'error'; message: string };

export function CloudUploadDropzone({ onUploadComplete, onError }: CloudUploadDropzoneProps) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        const msg = `Unsupported file type: ${file.type || 'unknown'}. Please upload MP4, WebM, MOV, or AVI.`;
        setState({ kind: 'error', message: msg });
        onError(msg);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        const msg = `File is too large (${formatBytes(file.size)}). Maximum size is 500 MB.`;
        setState({ kind: 'error', message: msg });
        onError(msg);
        return;
      }

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      let startTime = Date.now();
      let lastLoaded = 0;

      setState({ kind: 'uploading', file, percent: 0, speed: 0 });

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const now = Date.now();
        const dt = (now - startTime) / 1000;
        const dBytes = e.loaded - lastLoaded;
        lastLoaded = e.loaded;
        startTime = now;
        const speed = dt > 0 ? dBytes / dt : 0;
        const percent = Math.round((e.loaded / e.total) * 100);
        setState({ kind: 'uploading', file, percent, speed });
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result: UploadResult = JSON.parse(xhr.responseText);
            setState({ kind: 'success', file, result });
            onUploadComplete(result);
          } catch {
            const msg = 'Server returned an invalid response after upload.';
            setState({ kind: 'error', message: msg });
            onError(msg);
          }
        } else {
          let msg = `Upload failed (HTTP ${xhr.status}).`;
          try {
            const body = JSON.parse(xhr.responseText);
            if (body.error) msg = body.error;
          } catch {}
          setState({ kind: 'error', message: msg });
          onError(msg);
        }
      };

      xhr.onerror = () => {
        const msg = 'Upload failed: network error. Check your connection.';
        setState({ kind: 'error', message: msg });
        onError(msg);
      };

      xhr.onabort = () => {
        setState({ kind: 'idle' });
      };

      const fd = new FormData();
      fd.append('file', file);
      xhr.open('POST', '/api/upload');
      xhr.send(fd);
    },
    [onUploadComplete, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      e.target.value = '';
    },
    [upload]
  );

  const handleCancel = () => {
    xhrRef.current?.abort();
    setState({ kind: 'idle' });
  };

  const handleReset = () => setState({ kind: 'idle' });

  return (
    <div className="w-full">
      {state.kind === 'idle' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all select-none
            ${dragging
              ? 'border-brand-400 bg-brand-500/10'
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900/80'
            }`}
        >
          <UploadCloud className={`h-10 w-10 transition-colors ${dragging ? 'text-brand-400' : 'text-slate-500'}`} />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop your video here, or{' '}
              <span className="text-brand-400 underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">MP4, WebM, MOV, AVI — up to 500 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/avi,video/x-msvideo"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {state.kind === 'uploading' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white truncate max-w-[70%]">{state.file.name}</span>
            <span className="text-xs text-slate-400">{formatBytes(state.file.size)}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading… {state.percent}%</span>
              <span>{formatSpeed(state.speed)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-cyan transition-all duration-300"
                style={{ width: `${state.percent}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Cancel upload
          </button>
        </div>
      )}

      {state.kind === 'success' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white">Upload complete</span>
          </div>
          <p className="text-xs text-slate-400 pl-7 truncate">{state.file.name} · {formatBytes(state.file.size)}</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white">Upload failed</span>
          </div>
          <p className="text-xs text-red-300 pl-7">{state.message}</p>
          <button
            onClick={handleReset}
            className="ml-7 text-xs text-slate-400 underline hover:text-white"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
