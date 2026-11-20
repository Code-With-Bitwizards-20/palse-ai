export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WORKER_URL = process.env.MEDIA_WORKER_URL ?? 'http://localhost:8080';

export async function GET() {
  let workerHealth: unknown = null;

  try {
    const res = await fetch(`${WORKER_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      workerHealth = await res.json();
    }
  } catch {
    // Worker unreachable — workerHealth stays null
  }

  return Response.json(
    {
      app: 'healthy',
      worker: workerHealth,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'none'",
      },
    },
  );
}
