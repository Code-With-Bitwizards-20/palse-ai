export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

export async function GET() {
  try {
    const res = await fetch(`${WORKER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return Response.json(
        {
          status: 'degraded',
          workerReachable: false,
          workerUrl: WORKER_URL,
          statusCode: res.status,
          message: 'Worker returned a non-200 status code.',
        },
        { status: 502 },
      );
    }

    const data = await res.json();
    return Response.json(
      {
        status: 'healthy',
        workerReachable: true,
        workerUrl: WORKER_URL,
        ...data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return Response.json(
      {
        status: 'offline',
        workerReachable: false,
        workerUrl: WORKER_URL,
        message: 'Media worker service is not currently reachable.',
        detail: err.message,
      },
      { status: 503 },
    );
  }
}
