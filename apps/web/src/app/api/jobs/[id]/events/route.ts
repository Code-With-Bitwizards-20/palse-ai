export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/api/jobs/${encodeURIComponent(id)}/events`, {
      headers: { Accept: 'text/event-stream' },
    });
  } catch {
    // Emit a single error event so the browser EventSource gets something useful
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"type":"error","error":"Worker unavailable","code":"WORKER_UNAVAILABLE"}\n\n',
          ),
        );
        controller.close();
      },
    });
    return new Response(errorStream, {
      status: 503,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  if (!workerRes.ok || !workerRes.body) {
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: {"type":"error","error":"Worker returned ${workerRes.status}","code":"WORKER_ERROR"}\n\n`,
          ),
        );
        controller.close();
      },
    });
    return new Response(errorStream, {
      status: workerRes.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // Pipe the SSE stream from worker straight to the browser
  const readable = new ReadableStream({
    async start(controller) {
      const reader = workerRes.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch {
        // Client disconnected or worker closed
      } finally {
        reader.cancel().catch(() => {});
        controller.close();
      }
    },
    cancel() {
      workerRes.body?.cancel().catch(() => {});
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
