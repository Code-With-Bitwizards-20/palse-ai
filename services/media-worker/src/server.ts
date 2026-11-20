/**
 * server.ts — HTTP REST entry point for the media-worker service.
 * Uses ONLY node:http, node:fs, node:path, node:crypto, node:stream — no express.
 */

import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import * as stream from 'node:stream';
import { detectWorkerHardware, detectedEncoder } from './ffmpeg.js';
import { runMediaPipeline, type PipelineOptions, type PipelineResult } from './pipeline.js';
import type { JobProgressEvent, GeneratedClip } from '@shorts/shared';

// ─────────────────────────── Config ───────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8080', 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10);
const startedAt = Date.now();

// ─────────────────────────── Job State ────────────────────────────────────────
type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface JobState {
  jobId: string;
  status: JobStatus;
  stage: string;
  percent: number;
  startedAt: string;
  completedAt?: string;
  clips: GeneratedClip[];
  logs: string[];
  cancelController: AbortController;
  activeChildPids: Set<number>;
}

const jobs = new Map<string, JobState>();
const sseListeners = new Map<string, Set<http.ServerResponse>>();

// ─────────────────────────── SSE helpers ──────────────────────────────────────
function broadcastSSE(jobId: string, event: JobProgressEvent): void {
  const listeners = sseListeners.get(jobId);
  if (!listeners || listeners.size === 0) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of listeners) {
    try { res.write(payload); } catch { /* client gone */ }
  }
}

// ─────────────────────────── CORS ─────────────────────────────────────────────
function setCORSHeaders(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJSON(res: http.ServerResponse, status: number, body: unknown): void {
  setCORSHeaders(res);
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

function sendError(res: http.ServerResponse, status: number, message: string): void {
  sendJSON(res, status, { error: message });
}

// ─────────────────────────── Body reader ──────────────────────────────────────
function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ─────────────────────────── Multipart parser ─────────────────────────────────
interface ParsedFile {
  fieldname: string;
  filename: string;
  data: Buffer;
  mimeType: string;
}

async function parseMultipart(
  req: http.IncomingMessage,
  destDir: string
): Promise<{ files: ParsedFile[] }> {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) throw new Error('No boundary in multipart/form-data');
  const boundary = boundaryMatch[1];
  const raw = await readBody(req);

  const sep = Buffer.from(`--${boundary}`);
  const files: ParsedFile[] = [];

  let pos = 0;
  while (pos < raw.length) {
    const sepIdx = raw.indexOf(sep, pos);
    if (sepIdx === -1) break;
    pos = sepIdx + sep.length;
    if (raw[pos] === 45 && raw[pos + 1] === 45) break; // --boundary-- final
    if (raw[pos] === 13) pos += 2; // skip \r\n

    // Find header end (\r\n\r\n)
    const headerEnd = raw.indexOf(Buffer.from('\r\n\r\n'), pos);
    if (headerEnd === -1) break;
    const headerBlock = raw.slice(pos, headerEnd).toString('utf8');
    pos = headerEnd + 4;

    // Find next boundary
    const nextSep = raw.indexOf(sep, pos);
    const dataEnd = nextSep === -1 ? raw.length : nextSep - 2; // subtract \r\n before boundary
    const data = raw.slice(pos, dataEnd);
    pos = nextSep === -1 ? raw.length : nextSep;

    // Parse Content-Disposition
    const dispMatch = headerBlock.match(/Content-Disposition:[^\r\n]*name="([^"]+)"(?:;[^\r\n]*filename="([^"]+)")?/i);
    const ctMatch = headerBlock.match(/Content-Type:\s*([^\r\n]+)/i);
    if (!dispMatch) continue;
    const fieldname = dispMatch[1];
    const filename = dispMatch[2];
    if (!filename) continue; // skip non-file fields

    files.push({ fieldname, filename, data, mimeType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream' });
  }

  return { files };
}

// ─────────────────────────── Route: GET /health ───────────────────────────────
function handleHealth(res: http.ServerResponse): void {
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
  const activeJobs = [...jobs.values()].filter(j => j.status === 'RUNNING' || j.status === 'QUEUED').length;
  sendJSON(res, 200, {
    status: 'healthy',
    hardware: {
      encoderType: detectedEncoder.encoderType,
      encoderName: detectedEncoder.encoderName,
      ffmpegVersion: detectedEncoder.ffmpegVersion,
    },
    uptime: uptimeSeconds,
    activeJobs,
    timestamp: new Date().toISOString(),
  });
}

// ─────────────────────────── Route: POST /api/upload ─────────────────────────
async function handleUpload(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const jobId = crypto.randomUUID();
    const uploadDest = path.join(UPLOAD_DIR, 'uploads', jobId);
    fs.mkdirSync(uploadDest, { recursive: true });

    const { files } = await parseMultipart(req, uploadDest);
    if (files.length === 0) {
      sendError(res, 400, 'No file found in multipart body');
      return;
    }

    const file = files[0];
    const safeFilename = path.basename(file.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(uploadDest, safeFilename);
    fs.writeFileSync(filePath, file.data);

    sendJSON(res, 200, {
      filePath,
      jobId,
      originalName: file.filename,
      sizeBytes: file.data.length,
    });
  } catch (err: any) {
    sendError(res, 500, `Upload failed: ${err.message}`);
  }
}

// ─────────────────────────── Route: POST /api/jobs ───────────────────────────
async function handleCreateJob(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const body = await readBody(req);
    let payload: any;
    try { payload = JSON.parse(body.toString('utf8')); }
    catch { sendError(res, 400, 'Invalid JSON body'); return; }

    const {
      sourceFilePath,
      projectId,
      selectedDurationSeconds,
      remainderStrategy,
      qualityTier,
      enable60Fps,
      subtitleThemeId,
      reframeStrategy,
      enableCaptions,
      clippingMode,
    } = payload;

    if (!sourceFilePath) { sendError(res, 400, 'sourceFilePath is required'); return; }
    if (!selectedDurationSeconds) { sendError(res, 400, 'selectedDurationSeconds is required'); return; }

    // Check capacity
    const running = [...jobs.values()].filter(j => j.status === 'RUNNING').length;
    if (running >= MAX_CONCURRENT_JOBS) {
      sendError(res, 429, `Max concurrent jobs (${MAX_CONCURRENT_JOBS}) reached. Try again later.`);
      return;
    }

    const jobId = crypto.randomUUID();
    const resolvedProjectId = projectId || jobId;
    const outputDirectory = path.join(UPLOAD_DIR, 'outputs', jobId);
    fs.mkdirSync(outputDirectory, { recursive: true });

    const cancelController = new AbortController();
    const jobState: JobState = {
      jobId,
      status: 'QUEUED',
      stage: 'QUEUED',
      percent: 0,
      startedAt: new Date().toISOString(),
      clips: [],
      logs: [`[${new Date().toISOString()}] Job queued`],
      cancelController,
      activeChildPids: new Set(),
    };
    jobs.set(jobId, jobState);

    // Kick off pipeline asynchronously
    setImmediate(async () => {
      jobState.status = 'RUNNING';
      jobState.logs.push(`[${new Date().toISOString()}] Job started`);

      const pipelineOptions: PipelineOptions = {
        projectId: resolvedProjectId,
        jobId,
        sourceFilePath,
        outputDirectory,
        selectedDurationSeconds,
        remainderStrategy,
        qualityTier,
        enable60Fps,
        subtitleThemeId,
        reframeStrategy,
        enableCaptions,
        onProgress: (event: JobProgressEvent) => {
          if ((jobState.status as string) === 'CANCELLED') return;
          jobState.stage = event.stage;
          jobState.percent = event.percent;
          const logLine = `[${event.timestamp}] ${event.stageLabel} (${event.percent}%)`;
          jobState.logs.push(logLine);
          // Trim log to last 200 entries
          if (jobState.logs.length > 200) jobState.logs = jobState.logs.slice(-200);
          broadcastSSE(jobId, event);
        },
      };

      try {
        if (cancelController.signal.aborted) return;
        const result: PipelineResult = await runMediaPipeline(pipelineOptions);
        jobState.status = 'COMPLETED';
        jobState.percent = 100;
        jobState.completedAt = new Date().toISOString();
        jobState.clips = result.clips;
        jobState.logs.push(`[${new Date().toISOString()}] Completed — ${result.totalClips} clips`);

        broadcastSSE(jobId, {
          jobId,
          projectId: resolvedProjectId,
          stage: 'COMPLETED',
          stageLabel: 'Processing complete!',
          percent: 100,
          totalClips: result.totalClips,
          timestamp: new Date().toISOString(),
        } as JobProgressEvent);
      } catch (err: any) {
        if ((jobState.status as string) === 'CANCELLED') return;
        jobState.status = 'FAILED';
        jobState.completedAt = new Date().toISOString();
        const errMsg = `[${new Date().toISOString()}] FAILED: ${err.message}`;
        jobState.logs.push(errMsg);
        console.error(`[Job ${jobId}] Failed:`, err);

        broadcastSSE(jobId, {
          jobId,
          projectId: resolvedProjectId,
          stage: 'FAILED',
          stageLabel: `Failed: ${err.message}`,
          percent: jobState.percent,
          timestamp: new Date().toISOString(),
        } as JobProgressEvent);
      } finally {
        // Close SSE connections for this job after a short delay
        setTimeout(() => {
          const listeners = sseListeners.get(jobId);
          if (listeners) {
            for (const r of listeners) { try { r.end(); } catch { /* ignore */ } }
            sseListeners.delete(jobId);
          }
        }, 5000);
      }
    });

    sendJSON(res, 202, { jobId, status: 'QUEUED' });
  } catch (err: any) {
    sendError(res, 500, `Failed to create job: ${err.message}`);
  }
}

// ─────────────────────────── Route: GET /api/jobs/:id ─────────────────────────
function handleGetJob(jobId: string, res: http.ServerResponse): void {
  const job = jobs.get(jobId);
  if (!job) { sendError(res, 404, `Job ${jobId} not found`); return; }
  sendJSON(res, 200, {
    jobId: job.jobId,
    status: job.status,
    stage: job.stage,
    percent: job.percent,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    clips: job.clips,
    logs: job.logs,
  });
}

// ─────────────────────────── Route: GET /api/jobs/:id/events (SSE) ───────────
function handleJobEvents(jobId: string, req: http.IncomingMessage, res: http.ServerResponse): void {
  const job = jobs.get(jobId);
  if (!job) { sendError(res, 404, `Job ${jobId} not found`); return; }

  setCORSHeaders(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send current state immediately
  res.write(`data: ${JSON.stringify({
    jobId: job.jobId,
    stage: job.stage,
    percent: job.percent,
    status: job.status,
    timestamp: new Date().toISOString(),
  })}\n\n`);

  if (!sseListeners.has(jobId)) sseListeners.set(jobId, new Set());
  sseListeners.get(jobId)!.add(res);

  // Heartbeat every 15s
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); }
    catch { clearInterval(heartbeat); }
  }, 15_000);

  const cleanup = () => {
    clearInterval(heartbeat);
    sseListeners.get(jobId)?.delete(res);
  };

  req.on('close', cleanup);
  req.on('error', cleanup);
  res.on('error', cleanup);

  // If job already terminal, close after current state is sent
  if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
    setTimeout(() => { try { res.end(); } catch { /* ignore */ } cleanup(); }, 1000);
  }
}

// ─────────────────────────── Route: POST /api/jobs/:id/cancel ────────────────
function handleCancelJob(jobId: string, res: http.ServerResponse): void {
  const job = jobs.get(jobId);
  if (!job) { sendError(res, 404, `Job ${jobId} not found`); return; }
  if (job.status !== 'RUNNING' && job.status !== 'QUEUED') {
    sendError(res, 409, `Job is in terminal state: ${job.status}`); return;
  }

  job.cancelController.abort();
  job.status = 'CANCELLED';
  job.completedAt = new Date().toISOString();
  job.logs.push(`[${new Date().toISOString()}] Job cancelled`);

  // Close SSE listeners
  const listeners = sseListeners.get(jobId);
  if (listeners) {
    for (const r of listeners) { try { r.end(); } catch { /* ignore */ } }
    sseListeners.delete(jobId);
  }

  sendJSON(res, 200, { jobId, status: 'CANCELLED' });
}

// ─────────────────────────── Route: GET /api/downloads/:filename ──────────────
async function handleDownload(filename: string, res: http.ServerResponse): Promise<void> {
  // Safety: prevent path traversal
  const safeFilename = path.basename(filename);

  // Search in upload dir and outputs recursively (up to 2 levels)
  const searchDirs = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, 'outputs'),
    path.join(UPLOAD_DIR, 'uploads'),
  ];

  let foundPath: string | null = null;

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    // Check direct child
    const direct = path.join(dir, safeFilename);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) { foundPath = direct; break; }
    // Check one level deep (job sub-dirs)
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const candidate = path.join(dir, entry.name, safeFilename);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { foundPath = candidate; break; }
      }
    } catch { /* ignore */ }
    if (foundPath) break;
  }

  if (!foundPath) { sendError(res, 404, `File not found: ${safeFilename}`); return; }

  const stat = fs.statSync(foundPath);
  const ext = path.extname(safeFilename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.srt': 'text/plain; charset=utf-8',
    '.vtt': 'text/vtt; charset=utf-8',
    '.ass': 'text/plain; charset=utf-8',
    '.json': 'application/json',
    '.wav': 'audio/wav',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  setCORSHeaders(res);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${safeFilename}"`,
    'Content-Length': stat.size,
  });

  const readStream = fs.createReadStream(foundPath);
  readStream.pipe(res);
  readStream.on('error', () => { try { res.end(); } catch { /* ignore */ } });
}

// ─────────────────────────── Request Router ───────────────────────────────────
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const method = req.method || 'GET';
  const url = req.url || '/';

  // OPTIONS preflight
  if (method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Strip query string
  const urlPath = url.split('?')[0];

  // ── GET /health ──
  if (method === 'GET' && urlPath === '/health') {
    handleHealth(res);
    return;
  }

  // ── POST /api/upload ──
  if (method === 'POST' && urlPath === '/api/upload') {
    await handleUpload(req, res);
    return;
  }

  // ── POST /api/jobs ──
  if (method === 'POST' && urlPath === '/api/jobs') {
    await handleCreateJob(req, res);
    return;
  }

  // ── GET /api/jobs/:id ──
  const jobGetMatch = urlPath.match(/^\/api\/jobs\/([^/]+)$/);
  if (method === 'GET' && jobGetMatch) {
    handleGetJob(jobGetMatch[1], res);
    return;
  }

  // ── GET /api/jobs/:id/events ──
  const jobEventsMatch = urlPath.match(/^\/api\/jobs\/([^/]+)\/events$/);
  if (method === 'GET' && jobEventsMatch) {
    handleJobEvents(jobEventsMatch[1], req, res);
    return;
  }

  // ── POST /api/jobs/:id/cancel ──
  const jobCancelMatch = urlPath.match(/^\/api\/jobs\/([^/]+)\/cancel$/);
  if (method === 'POST' && jobCancelMatch) {
    handleCancelJob(jobCancelMatch[1], res);
    return;
  }

  // ── GET /api/downloads/:filename ──
  const downloadMatch = urlPath.match(/^\/api\/downloads\/(.+)$/);
  if (method === 'GET' && downloadMatch) {
    await handleDownload(decodeURIComponent(downloadMatch[1]), res);
    return;
  }

  sendError(res, 404, `Route not found: ${method} ${urlPath}`);
}

// ─────────────────────────── Startup ──────────────────────────────────────────
async function main(): Promise<void> {
  // Ensure upload dir exists
  fs.mkdirSync(path.join(UPLOAD_DIR, 'uploads'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'outputs'), { recursive: true });

  // Detect hardware encoder
  console.log('[Server] Detecting hardware encoder...');
  const hw = await detectWorkerHardware();
  console.log(`[Server] Hardware: ${hw.encoderType} → ${hw.encoderName} (FFmpeg ${hw.ffmpegVersion})`);

  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error('[Server] Unhandled request error:', err);
      try { sendError(res, 500, 'Internal server error'); } catch { /* already sent */ }
    });
  });

  server.listen(PORT, () => {
    console.log(`[Server] Media worker listening on port ${PORT}`);
    console.log(`[Server] UPLOAD_DIR=${UPLOAD_DIR}, MAX_CONCURRENT_JOBS=${MAX_CONCURRENT_JOBS}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => { server.close(() => process.exit(0)); });
  process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
}

main().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
