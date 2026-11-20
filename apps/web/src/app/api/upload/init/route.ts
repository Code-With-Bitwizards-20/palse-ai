export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'node:crypto';

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB chunks

const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/avi',
  'video/x-matroska',
]);

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

  const { filename, sizeBytes, mimeType, projectId } = body;

  if (!filename || typeof filename !== 'string') {
    return Response.json(
      { success: false, error: 'Missing filename.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  if (typeof sizeBytes !== 'number' || sizeBytes <= 0) {
    return Response.json(
      { success: false, error: 'Invalid sizeBytes parameter.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  if (sizeBytes > MAX_BYTES) {
    return Response.json(
      {
        success: false,
        error: `File size exceeds the 500 MB limit (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB).`,
        code: 'FILE_TOO_LARGE',
      },
      { status: 413 },
    );
  }

  const cleanMime = (mimeType || '').split(';')[0].trim().toLowerCase();
  if (cleanMime && !ALLOWED_MIME_TYPES.has(cleanMime)) {
    return Response.json(
      {
        success: false,
        error: `MIME type "${cleanMime}" is not a supported video format.`,
        code: 'INVALID_MIME_TYPE',
      },
      { status: 415 },
    );
  }

  const uploadId = crypto.randomUUID();
  const totalChunks = Math.ceil(sizeBytes / CHUNK_SIZE);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return Response.json(
    {
      success: true,
      uploadId,
      projectId: projectId || uploadId,
      filename,
      sizeBytes,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      expiresAt,
      uploadUrl: `/api/upload?uploadId=${uploadId}`,
    },
    { status: 200 },
  );
}
