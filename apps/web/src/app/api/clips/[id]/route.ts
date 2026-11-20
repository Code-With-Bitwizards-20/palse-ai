export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
    hookText,
    mainTopic,
    summary,
    subtitleThemeId,
    reframeStrategy,
    cropCenterX,
  } = body;

  try {
    const updated = await prisma.clip.update({
      where: { id },
      data: {
        ...(hookText !== undefined && { hookText }),
        ...(mainTopic !== undefined && { mainTopic }),
        ...(summary !== undefined && { summary }),
        ...(subtitleThemeId !== undefined && { subtitleThemeId }),
        ...(reframeStrategy !== undefined && { reframeStrategy }),
        ...(cropCenterX !== undefined && { cropCenterX: Number(cropCenterX) }),
      },
    });

    return Response.json({ success: true, clip: updated }, { status: 200 });
  } catch (err: any) {
    console.error(`[PATCH /api/clips/${id}] Error:`, err);
    return Response.json(
      { success: false, error: 'Clip not found or update failed.', code: 'UPDATE_FAILED' },
      { status: 404 },
    );
  }
}
