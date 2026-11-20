export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

function workerUnavailable() {
  return Response.json(
    { error: 'Remote worker unavailable. Please try again.', code: 'WORKER_UNAVAILABLE' },
    { status: 503 },
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/api/jobs/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return workerUnavailable();
  }

  const data = await workerRes.json().catch(() => ({}));
  return Response.json(data, { status: workerRes.status });
}
