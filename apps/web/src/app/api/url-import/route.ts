export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { checkSsrf } from '@/lib/ssrfGuard';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

function workerUnavailable() {
  return Response.json(
    { error: 'Remote worker unavailable. Please try again.', code: 'WORKER_UNAVAILABLE' },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const { url } = body as { url?: string };

  if (!url || typeof url !== 'string') {
    return Response.json({ error: 'Missing required field: url', code: 'BAD_REQUEST' }, { status: 400 });
  }

  // --- SSRF check ---
  const ssrf = checkSsrf(url);
  if (!ssrf.allowed) {
    return Response.json(
      { valid: false, reason: ssrf.reason ?? 'URL not allowed.' },
      { status: 422 },
    );
  }

  // --- HEAD request to validate remote resource ---
  let headRes: Response;
  try {
    headRes = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    });
  } catch {
    return Response.json(
      { valid: false, reason: 'Could not reach the provided URL.' },
      { status: 422 },
    );
  }

  if (!headRes.ok) {
    return Response.json(
      { valid: false, reason: `Remote URL returned HTTP ${headRes.status}.` },
      { status: 422 },
    );
  }

  const contentType = (headRes.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!contentType.startsWith('video/')) {
    return Response.json(
      { valid: false, reason: `Content-Type "${contentType}" is not a video type.` },
      { status: 422 },
    );
  }

  const contentLengthHeader = headRes.headers.get('content-length');
  const sizeBytes = contentLengthHeader !== null ? parseInt(contentLengthHeader, 10) : null;

  if (sizeBytes !== null && !isNaN(sizeBytes) && sizeBytes > MAX_BYTES) {
    return Response.json(
      { valid: false, reason: 'Remote file exceeds the 500 MB size limit.' },
      { status: 422 },
    );
  }

  // --- Forward to worker as a URL-sourced job ---
  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlSource: url }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return workerUnavailable();
  }

  const workerData = await workerRes.json().catch(() => ({}));

  return Response.json(
    {
      valid: true,
      contentType,
      sizeBytes: sizeBytes ?? null,
      url,
      ...workerData,
    },
    { status: workerRes.status },
  );
}
