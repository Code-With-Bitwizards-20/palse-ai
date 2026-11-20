export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/avi',
]);

function workerUnavailable() {
  return Response.json(
    { error: 'Remote worker unavailable. Please try again.', code: 'WORKER_UNAVAILABLE' },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  // Validate Content-Length early if the browser sends it
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    const bytes = parseInt(contentLength, 10);
    if (!isNaN(bytes) && bytes > MAX_BYTES) {
      return Response.json(
        { error: 'File exceeds the 500 MB size limit.', code: 'FILE_TOO_LARGE' },
        { status: 413 },
      );
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid multipart form data.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file field found in form data.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  // Validate MIME type
  const mimeType = file.type.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return Response.json(
      {
        error: `Unsupported file type "${mimeType}". Allowed: mp4, webm, mov, avi.`,
        code: 'INVALID_MIME_TYPE',
      },
      { status: 415 },
    );
  }

  // Validate actual size
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: 'File exceeds the 500 MB size limit.', code: 'FILE_TOO_LARGE' },
      { status: 413 },
    );
  }

  // Forward to worker
  const workerForm = new FormData();
  workerForm.append('file', file, file.name);

  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/api/upload`, {
      method: 'POST',
      body: workerForm,
      signal: AbortSignal.timeout(120_000), // 2 min for large uploads
    });
  } catch {
    return workerUnavailable();
  }

  if (!workerRes.ok) {
    const text = await workerRes.text().catch(() => '');
    return Response.json(
      { error: 'Worker rejected the upload.', code: 'WORKER_ERROR', detail: text },
      { status: workerRes.status },
    );
  }

  const data = await workerRes.json();
  // Return: { jobId, filePath, originalName, sizeBytes }
  return Response.json(data, { status: 200 });
}
