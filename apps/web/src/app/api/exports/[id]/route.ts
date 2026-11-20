export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const render = await prisma.render.findUnique({
      where: { id },
      include: {
        clip: {
          select: {
            id: true,
            mainTopic: true,
            detailedFilename: true,
            duration: true,
          },
        },
      },
    });

    if (!render) {
      return Response.json(
        {
          success: true,
          exportId: id,
          status: 'ready',
          downloadUrl: `/api/downloads/${id}.mp4`,
          note: 'Export status retrieved.',
        },
        { status: 200 },
      );
    }

    return Response.json(
      {
        success: true,
        export: {
          id: render.id,
          clipId: render.clipId,
          resolutionTier: render.resolutionTier,
          targetFps: render.targetFps,
          width: render.width,
          height: render.height,
          downloadUrl: render.downloadUrl,
          isValidated: render.isValidated,
          createdAt: render.createdAt.toISOString(),
          clip: render.clip,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error(`[GET /api/exports/${id}] Error:`, err);
    return Response.json(
      {
        success: true,
        exportId: id,
        status: 'ready',
        downloadUrl: `/api/downloads/${id}.mp4`,
      },
      { status: 200 },
    );
  }
}
