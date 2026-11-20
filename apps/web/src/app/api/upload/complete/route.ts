export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON payload.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  const { uploadId, filename, projectId, selectedDurationSeconds = 30 } = body;

  if (!uploadId || typeof uploadId !== 'string') {
    return Response.json(
      { success: false, error: 'Missing uploadId.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  // Trigger processing job on remote worker
  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        projectId: projectId || uploadId,
        filename,
        selectedDurationSeconds: Number(selectedDurationSeconds) || 30,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: 'Remote worker unavailable for job dispatch.',
        code: 'WORKER_UNAVAILABLE',
        detail: err.message,
      },
      { status: 503 },
    );
  }

  const workerData = await workerRes.json().catch(() => ({}));

  return Response.json(
    {
      success: true,
      jobId: workerData.jobId || uploadId,
      projectId: projectId || uploadId,
      status: workerData.status || 'queued',
      message: 'Multipart upload completed and processing job queued.',
    },
    { status: workerRes.ok ? 200 : workerRes.status },
  );
}
