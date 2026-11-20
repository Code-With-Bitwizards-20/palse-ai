export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        sourceVideo: true,
        clips: {
          include: {
            transcriptWords: { take: 50 },
            platformMetadata: true,
            renders: true,
          },
        },
        processingJobs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      return Response.json(
        { success: false, error: `Project ${id} not found.`, code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return Response.json(
      {
        success: true,
        project: {
          ...project,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error(`[GET /api/projects/${id}] Error:`, err);
    return Response.json(
      { success: false, error: 'Failed to retrieve project.', code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let updates: any;
  try {
    updates = await request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON payload.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        title: updates.title,
        subtitleThemeId: updates.subtitleThemeId,
        selectedDuration: updates.selectedDuration,
        targetAspectRatio: updates.targetAspectRatio,
        qualityTier: updates.qualityTier,
        status: updates.status,
      },
    });

    return Response.json({ success: true, project }, { status: 200 });
  } catch (err: any) {
    console.error(`[PATCH /api/projects/${id}] Error:`, err);
    return Response.json(
      { success: false, error: 'Project not found or update failed.', code: 'UPDATE_FAILED' },
      { status: 404 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.project.delete({
      where: { id },
    });
    return Response.json(
      { success: true, message: `Project ${id} deleted successfully.` },
      { status: 200 },
    );
  } catch (err: any) {
    console.error(`[DELETE /api/projects/${id}] Error:`, err);
    return Response.json(
      { success: false, error: 'Project not found or already deleted.', code: 'DELETE_FAILED' },
      { status: 404 },
    );
  }
}
