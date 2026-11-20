export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  try {
    const clips = await prisma.clip.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { clipIndex: 'asc' },
      include: {
        transcriptWords: true,
        platformMetadata: true,
        renders: true,
      },
    });

    return Response.json(
      {
        success: true,
        count: clips.length,
        clips: clips.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[GET /api/clips] Error:', err);
    return Response.json(
      { success: true, count: 0, clips: [] },
      { status: 200 },
    );
  }
}
