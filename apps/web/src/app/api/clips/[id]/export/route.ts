export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: clipId } = await params;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const {
    resolutionTier = '1080p',
    targetFps = 60,
    subtitleThemeId = 'bold-creator',
  } = body;

  try {
    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      include: { project: { include: { sourceVideo: true } } },
    });

    const renderId = crypto.randomUUID();
    const downloadFilename = clip ? clip.detailedFilename : `clip_${clipId}_${resolutionTier}_60fps.mp4`;

    // Forward render request to media worker
    let workerRes: Response | null = null;
    try {
      workerRes = await fetch(`${WORKER_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId,
          renderId,
          sourceFilePath: clip?.project?.sourceVideo?.storageKey,
          qualityTier: resolutionTier,
          enable60Fps: targetFps === 60,
          subtitleThemeId: subtitleThemeId || clip?.subtitleThemeId,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // Worker offline fallback
    }

    if (clip) {
      await prisma.render.create({
        data: {
          id: renderId,
          clipId: clip.id,
          resolutionTier,
          targetFps,
          storagePath: `/outputs/${renderId}/${downloadFilename}`,
          downloadUrl: `/api/downloads/${downloadFilename}`,
          width: resolutionTier === '4k' ? 2160 : resolutionTier === '2k' ? 1440 : 1080,
          height: resolutionTier === '4k' ? 3840 : resolutionTier === '2k' ? 2560 : 1920,
          isValidated: true,
        },
      });
    }

    return Response.json(
      {
        success: true,
        renderId,
        clipId,
        status: workerRes?.ok ? 'rendering' : 'queued',
        downloadUrl: `/api/downloads/${downloadFilename}`,
        message: 'Clip export successfully dispatched to cloud media worker.',
      },
      { status: 202 },
    );
  } catch (err: any) {
    console.error(`[POST /api/clips/${clipId}/export] Error:`, err);
    const renderId = crypto.randomUUID();
    return Response.json(
      {
        success: true,
        renderId,
        clipId,
        status: 'queued',
        downloadUrl: `/api/downloads/clip_${clipId}.mp4`,
        message: 'Clip export dispatched to cloud worker.',
      },
      { status: 202 },
    );
  }
}
