export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { resolveAndValidateSource } from '@/lib/sourceAdapters';
import { prisma } from '@/lib/prisma';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  const {
    url,
    projectId,
    selectedDurationSeconds = 30,
    subtitleThemeId = 'bold-creator',
    remainderStrategy = 'ignore',
    reframeStrategy = 'ai-smart-crop',
    qualityTier = '1080p',
    enable60Fps = true,
  } = body;

  if (!url || typeof url !== 'string') {
    return Response.json(
      { success: false, error: 'Missing required field: url', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  // Run modular source adapter resolution & validation
  const validation = await resolveAndValidateSource(url.trim());

  if (!validation.allowed) {
    return Response.json(
      {
        success: false,
        valid: validation.valid,
        provider: validation.provider,
        code: validation.code,
        message: validation.message,
        guidance: validation.guidance,
        videoId: validation.videoId,
        title: validation.title,
        author: validation.author,
        thumbnailUrl: validation.thumbnailUrl,
        directUploadRecommended: validation.directUploadRecommended ?? false,
      },
      { status: 422 },
    );
  }

  // Direct media is verified. Ensure a project exists in the database.
  let targetProjectId = projectId;
  if (!targetProjectId) {
    try {
      // Find or create a default demo user
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'creator@pulsecut.ai',
            name: 'PulseCut Creator',
            planTier: 'PRO_CREATOR',
          },
        });
      }

      const project = await prisma.project.create({
        data: {
          userId: user.id,
          title: `Imported: ${new URL(url).pathname.split('/').pop() || 'Remote Video'}`,
          selectedDuration: Number(selectedDurationSeconds) || 30,
          subtitleThemeId,
          remainderStrategy,
          reframeStrategy,
          qualityTier,
          enable60Fps: Boolean(enable60Fps),
          status: 'PROCESSING',
        },
      });
      targetProjectId = project.id;
    } catch (dbErr) {
      console.warn('[Upload URL] Database persist warning:', dbErr);
      targetProjectId = crypto.randomUUID();
    }
  }

  // Forward job to remote media worker
  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urlSource: url,
        projectId: targetProjectId,
        selectedDurationSeconds: Number(selectedDurationSeconds) || 30,
        subtitleThemeId,
        remainderStrategy,
        reframeStrategy,
        qualityTier,
        enable60Fps,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: 'Remote media worker is currently unavailable.',
        code: 'WORKER_UNAVAILABLE',
        detail: err.message,
      },
      { status: 503 },
    );
  }

  if (!workerRes.ok) {
    const errorText = await workerRes.text().catch(() => '');
    return Response.json(
      {
        success: false,
        error: 'Worker rejected the URL processing job.',
        code: 'WORKER_ERROR',
        detail: errorText,
      },
      { status: workerRes.status },
    );
  }

  const workerData = await workerRes.json().catch(() => ({}));

  return Response.json(
    {
      success: true,
      jobId: workerData.jobId,
      projectId: targetProjectId,
      status: workerData.status || 'queued',
      message: 'Video import job queued successfully on cloud worker.',
      metadata: {
        url,
        provider: validation.provider,
        contentType: validation.contentType,
        sizeBytes: validation.sizeBytes,
      },
    },
    { status: 200 },
  );
}
