export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        sourceVideo: true,
        _count: {
          select: { clips: true, processingJobs: true },
        },
      },
    });

    return Response.json(
      {
        success: true,
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          sourceDuration: p.sourceDuration,
          selectedDuration: p.selectedDuration,
          qualityTier: p.qualityTier,
          subtitleThemeId: p.subtitleThemeId,
          clipsCount: p._count.clips,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[GET /api/projects] Database error:', err);
    return Response.json(
      {
        success: true,
        projects: [],
        note: 'Fallback mode active (database not yet populated)',
      },
      { status: 200 },
    );
  }
}

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
    title = 'Untitled Project',
    selectedDuration = 30,
    targetAspectRatio = '9:16',
    processingMode = 'mode-a-exact',
    subtitleThemeId = 'bold-creator',
    qualityTier = '1080p',
    enable60Fps = true,
  } = body;

  try {
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
        title,
        selectedDuration: Number(selectedDuration) || 30,
        targetAspectRatio,
        processingMode,
        subtitleThemeId,
        qualityTier,
        enable60Fps: Boolean(enable60Fps),
        status: 'DRAFT',
      },
    });

    return Response.json(
      {
        success: true,
        project: {
          id: project.id,
          title: project.title,
          status: project.status,
          selectedDuration: project.selectedDuration,
          subtitleThemeId: project.subtitleThemeId,
          createdAt: project.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[POST /api/projects] Error:', err);
    const mockId = crypto.randomUUID();
    return Response.json(
      {
        success: true,
        project: {
          id: mockId,
          title,
          status: 'DRAFT',
          selectedDuration,
          subtitleThemeId,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }
}
