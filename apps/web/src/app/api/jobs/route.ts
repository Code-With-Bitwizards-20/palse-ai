export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

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

  const payload = body as Record<string, unknown>;

  // Basic validation
  if (!payload.sourceFilePath || typeof payload.sourceFilePath !== 'string') {
    return Response.json(
      { error: 'Missing required field: sourceFilePath', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return workerUnavailable();
  }

  const data = await workerRes.json().catch(() => ({}));
  return Response.json(data, { status: workerRes.status });
}
