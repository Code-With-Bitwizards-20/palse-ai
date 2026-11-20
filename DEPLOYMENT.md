# PulseCut AI — Deployment Guide

> [!IMPORTANT]
> PulseCut AI uses a **cloud architecture**: the Next.js frontend is stateless and deployed to Vercel, while all video processing runs in a separate **media worker** Docker container. You must deploy both to get a working production instance.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                            │
│   Next.js App (Vercel)  ──upload──▶  /api/upload (proxy)      │
│       │                                      │                 │
│       │◀── SSE progress events ──────────────┤                 │
│       │◀── download clip ────────────────────┘                 │
└───────┬────────────────────────────────────────────────────────┘
        │  HTTPS
        ▼
┌───────────────────────┐       ┌──────────────────────────────┐
│   Vercel (Frontend)   │──────▶│  Media Worker (Docker)       │
│   Next.js 15 App      │ HTTP  │  Node.js HTTP server :8080   │
│   /api/* proxy routes │       │  FFmpeg + libass + fonts     │
└───────────────────────┘       └──────────┬───────────────────┘
                                           │
                      ┌────────────────────┼────────────────────┐
                      ▼                    ▼                     ▼
              ┌──────────────┐   ┌──────────────────┐  ┌──────────────┐
              │  PostgreSQL  │   │  Redis (BullMQ)  │  │ Object Store │
              │  (Supabase)  │   │  (Upstash)       │  │ (R2 / local) │
              └──────────────┘   └──────────────────┘  └──────────────┘
```

---

## Infrastructure Options & Honest Notes

### Frontend (Next.js)
| Provider | Free Tier | Notes |
|---|---|---|
| **Vercel** ✅ | 100 GB bandwidth/month | Best option — zero-config Next.js support |
| Netlify | 100 GB bandwidth/month | Also works, change publish dir to `.next` |

### Media Worker (Docker — FFmpeg)
| Provider | Free Tier | Honest Assessment |
|---|---|---|
| **Railway** ✅ | $5 credit/month | **Best cheapest option.** Not permanently free — but $5/month goes a long way with auto-sleep. |
| Render | 512 MB RAM, 0.1 CPU | ⚠️ **Too slow for FFmpeg video processing.** Transcoding will time out. |
| Fly.io | 256 MB RAM | ⚠️ **Insufficient RAM** for FFmpeg with large video files. |
| **Self-host** ✅ | Your own server | **Recommended for heavy use.** Even a $4/month DigitalOcean Droplet (1 GB RAM) handles CPU encoding fine. Home server or NAS also works. |

### Redis (Job Queue)
| Provider | Free Tier | Notes |
|---|---|---|
| **Upstash** ✅ | 10,000 commands/day | Sufficient for a personal/small-team queue. Serverless pricing after free tier. |
| Redis Cloud | 30 MB free | Also fine for queue-only usage |

### PostgreSQL
| Provider | Free Tier | Notes |
|---|---|---|
| **Supabase** ✅ | 500 MB, 2 projects | Best free PostgreSQL. Pauses after 1 week of inactivity on free tier. |
| Neon | 512 MB | Serverless, also excellent |

### Object Storage
| Provider | Free Tier | Notes |
|---|---|---|
| **Cloudflare R2** ✅ | 10 GB/month storage, **free egress** | **Best option.** No egress fees makes it ideal for video downloads. |
| AWS S3 | None permanently free | Egress fees add up quickly for video |
| Local disk | Unlimited | Only for self-hosted workers |

### GPU / AI Transcription
> [!WARNING]
> **Free GPU permanently is NOT reliable.** Do not design your production setup around permanently-free GPU.
>
> - **Hugging Face Spaces GPU (T4)**: Can be used for Whisper transcription but has cold start delays (30–60s) and usage limits. Not suitable as a persistent service.
> - **For most users**: Remote CPU transcription via `libx264` is the **reliable, free, and recommended** option. Modern CPUs handle 1080p encoding in real-time for short clips.
> - If you need GPU: rent a $0.10–0.50/hr GPU spot instance on vast.ai or Lambda Labs when needed.

---

## Step-by-Step Deployment

### Step 1 — Fork and Clone

```bash
git clone https://github.com/Code-With-Bitwizards-20/pulsecut-local-ai.git
cd pulsecut-local-ai
npm install
```

### Step 2 — Set Up Supabase PostgreSQL

1. Go to [https://supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to your media worker's region
3. Under **Settings → Database**, copy the **Connection string (URI)**:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Save this as `DATABASE_URL` in your environment

### Step 3 — Set Up Upstash Redis

1. Go to [https://upstash.com](https://upstash.com) → **Create Database**
2. Choose **Regional**, pick the same region as your worker
3. Copy the **Redis URL** (the `rediss://` TLS format):
   ```
   rediss://:<password>@<host>.upstash.io:6379
   ```
4. Save this as `REDIS_URL` in your environment

### Step 4 — Set Up Cloudflare R2 Storage

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**
2. Create a bucket named `pulsecut-media`
3. Under **Manage R2 API Tokens**, create a token with **Object Read & Write** permission
4. Note your **Account ID** from the right sidebar
5. Set these environment variables:
   ```
   S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
   S3_BUCKET="pulsecut-media"
   S3_ACCESS_KEY_ID="<token-access-key-id>"
   S3_SECRET_ACCESS_KEY="<token-secret>"
   S3_REGION="auto"
   STORAGE_DRIVER="r2"
   ```
6. (Optional) Enable **Public Access** on the bucket and set `S3_PUBLIC_URL` to the public domain for direct download links

### Step 5 — Configure Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Generate a secure `WORKER_SECRET`:
```bash
# On Linux/macOS:
openssl rand -hex 32
# On Windows (PowerShell):
[System.Web.Security.Membership]::GeneratePassword(32, 4)
```

### Step 6 — Deploy Frontend to Vercel

1. Push your repo to GitHub
2. Go to [https://vercel.com/new](https://vercel.com/new) and import your repository
3. Set the following in Vercel project settings:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: `Next.js` (auto-detected)
   - **Install Command**: `cd ../.. && npm install`
4. Add these **Environment Variables** in Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `MEDIA_WORKER_URL` | Your worker URL (e.g. `https://my-worker.up.railway.app`) |
   | `WORKER_SECRET` | Your generated secret |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |
   | `NODE_ENV` | `production` |

5. Click **Deploy**

### Step 7 — Deploy Media Worker to Railway

#### Option A: Railway (cheapest cloud option)

1. Install Railway CLI: `npm install -g @railway/cli`
2. From repo root:
   ```bash
   railway login
   railway init
   railway up --dockerfile services/media-worker/Dockerfile.worker
   ```
3. Set environment variables in Railway dashboard:
   - `DATABASE_URL`, `REDIS_URL`, `STORAGE_DRIVER`, `UPLOAD_DIR`, `WORKER_SECRET`
   - `S3_*` variables if using R2
4. Note the generated Railway URL (e.g. `https://my-worker.up.railway.app`)

#### Option B: Self-Host on any VPS / home server

```bash
# On your server:
git clone https://github.com/Code-With-Bitwizards-20/pulsecut-local-ai.git
cd pulsecut-local-ai

# Build the Docker image
docker build -f services/media-worker/Dockerfile.worker -t pulsecut-worker .

# Run with environment variables
docker run -d \
  --name pulsecut-worker \
  --restart unless-stopped \
  -p 8080:8080 \
  -v /data/uploads:/app/uploads \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="rediss://..." \
  -e STORAGE_DRIVER="r2" \
  -e S3_ENDPOINT="https://..." \
  -e S3_BUCKET="pulsecut-media" \
  -e S3_ACCESS_KEY_ID="..." \
  -e S3_SECRET_ACCESS_KEY="..." \
  -e S3_REGION="auto" \
  -e WORKER_SECRET="your-secret-here" \
  -e MAX_CONCURRENT_JOBS=2 \
  pulsecut-worker
```

Use a reverse proxy (nginx/Caddy) with TLS in front of port 8080 for HTTPS.

### Step 8 — Verify Worker Health Check

After deployment, hit the health endpoint:

```bash
curl https://your-worker-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "hardware": {
    "encoderType": "CPU",
    "encoderName": "libx264",
    "ffmpegVersion": "6.1.1"
  },
  "uptime": 42.5,
  "activeJobs": 0,
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

If `encoderType` is `GPU`, hardware acceleration was detected. If `CPU`, that's perfectly fine — `libx264` reliably handles all supported resolutions.

### Step 9 — Test End-to-End

1. Open your Vercel frontend URL
2. Navigate to **Studio**
3. Upload a short test video (< 60 seconds recommended for first test)
4. Verify:
   - Upload progress bar fills
   - Processing status updates via SSE
   - Clips appear in results panel
   - Download works and produces valid MP4

---

## Production Readiness Checklist

- [ ] `WORKER_SECRET` is a random 32+ character string (not the example value)
- [ ] `DATABASE_URL` points to a managed PostgreSQL instance (not SQLite)
- [ ] `REDIS_URL` points to a managed Redis instance
- [ ] `STORAGE_DRIVER` is `r2` or `s3` (not `local`) for multi-instance deployments
- [ ] Worker is accessible via HTTPS (not plain HTTP)
- [ ] `NEXT_PUBLIC_MEDIA_WORKER_URL` is set in Vercel environment variables
- [ ] `MEDIA_WORKER_URL` is set in Vercel environment variables (server-side)
- [ ] Health check endpoint responds: `GET /health` → `{ status: 'healthy' }`
- [ ] `MAX_CONCURRENT_JOBS` is tuned to your server's CPU count (default: 2)
- [ ] `OUTPUT_RETENTION_HOURS` is set — clips are deleted after this many hours
- [ ] Log monitoring is set up (Railway/Render have built-in log tailing)
- [ ] A cron job or worker cleanup task removes expired uploads

---

## Troubleshooting

### Worker health check fails (`curl /health` returns connection refused)
- Check the worker container is running: `docker ps`
- Check port mapping: `docker port pulsecut-worker`
- Check worker logs: `docker logs pulsecut-worker`

### FFmpeg not found in container
- Ensure you're using `Dockerfile.worker` (not a plain Node Dockerfile)
- The image is based on `node:22-bookworm-slim` with FFmpeg installed via apt

### Upload fails with 413 error
- Increase `MAX_UPLOAD_SIZE_MB` in your environment
- On Vercel: add `export const config = { api: { bodyParser: { sizeLimit: '500mb' } } }` to upload route (already included)
- On nginx: increase `client_max_body_size`

### SSE events not received (progress bar frozen)
- Vercel has a 30-second timeout on streaming responses. The worker sends heartbeats every 15s to keep the connection alive.
- If using a custom proxy/CDN, ensure it does not buffer SSE responses (disable proxy buffering for `/api/jobs/*/events`)

### Jobs stuck in QUEUED status
- Check Redis connection: `redis-cli -u "$REDIS_URL" ping` should return `PONG`
- Check `MAX_CONCURRENT_JOBS` — if set to 0, no jobs will run
- Check worker logs for FFmpeg errors

### Videos render but have no subtitles
- Ensure `fonts-liberation`, `fonts-dejavu-core`, and `fonts-noto` are installed (included in `Dockerfile.worker`)
- Check that `libass` support is compiled into the FFmpeg binary: `ffmpeg -filters | grep ass`
- On Debian Bookworm, the apt FFmpeg package includes libass

### Clip download fails (404)
- If using `STORAGE_DRIVER=local`, ensure the worker's `UPLOAD_DIR` volume is mounted persistently
- If using `STORAGE_DRIVER=r2`, verify S3 credentials and bucket name
- Check `S3_PUBLIC_URL` is set if you want public URLs instead of signed URLs

### "WORKER_SECRET mismatch" errors
- Ensure the same `WORKER_SECRET` value is set in both Vercel and the worker environment
- Check for trailing whitespace or newline characters in the secret value

---

## Cost Estimate (Low-Traffic Instance)

| Service | Free Tier | Paid (if exceeded) |
|---|---|---|
| Vercel (frontend) | Free (100 GB bandwidth) | $20/month Pro |
| Railway (worker) | $5 credit/month | ~$5–15/month depending on CPU |
| Upstash Redis | Free (10k commands/day) | $0.20 per 100k commands |
| Supabase PostgreSQL | Free (500 MB) | $25/month Pro |
| Cloudflare R2 | Free (10 GB storage, free egress) | $0.015/GB storage |
| **Total (light use)** | **~$0–$5/month** | |
