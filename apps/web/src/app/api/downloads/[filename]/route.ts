export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

function workerUnavailable() {
  return Response.json(
    { error: 'Remote worker unavailable. Please try again.', code: 'WORKER_UNAVAILABLE' },
    { status: 503 },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // Sanitize filename — no path traversal
  const safe = filename.replace(/[/\\]/g, '');
  if (!safe || safe !== filename) {
    return Response.json({ error: 'Invalid filename.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/api/downloads/${encodeURIComponent(safe)}`);
  } catch {
    return workerUnavailable();
  }

  if (!workerRes.ok || !workerRes.body) {
    return Response.json(
      { error: 'File not found or worker error.', code: 'NOT_FOUND' },
      { status: workerRes.status },
    );
  }

  // Forward content-type and length from worker; force download via Content-Disposition
  const headers = new Headers();
  const ct = workerRes.headers.get('content-type');
  if (ct) headers.set('Content-Type', ct);
  const cl = workerRes.headers.get('content-length');
  if (cl) headers.set('Content-Length', cl);
  headers.set('Content-Disposition', `attachment; filename="${safe}"`);
  headers.set('Cache-Control', 'private, no-store');

  return new Response(workerRes.body, { status: 200, headers });
}
