# PulseCut AI — Project Audit Report

**Date:** November 2026  
**Auditor:** Principal Software & Video Architecture Lead  
**Repository:** [Code-With-Bitwizards-20/palse-ai](https://github.com/Code-With-Bitwizards-20/palse-ai)  
**Parent Developer Brand:** [Code With Bitwizards](https://code-with-bitwizards.vercel.app/)  
**Baseline Git Branch:** `main` (Backup created: `backup-pre-upgrade`)  

---

## 1. Executive Summary

PulseCut Local AI is currently a high-performance in-browser video reframing and clipping platform built on Next.js 15, React 19, TypeScript, Tailwind CSS, WebCodecs, Web Audio API, Mediabunny, and mp4-muxer. 

The application architecture has two concurrent tracks in the repository:
1. **Active Production Track (Client-Side Studio):** Located in `apps/web/src/app/studio/page.tsx` and `apps/web/src/lib/videoEngine.ts`. This engine executes 100% inside the browser on the user's hardware. It renders hardware-accelerated H.264/AAC MP4 clips at 60 FPS, computes non-blocking transforms via sequential Mediabunny demuxing and OffscreenCanvas compositing, and requires zero paid API keys or server compute.
2. **Legacy/Experimental Server Track:** Located in `services/media-worker` and `prisma/schema.prisma`. It contains BullMQ queue workers, FFmpeg/ffprobe wrappers, PostgreSQL/SQLite Docker setups, and SSE event streaming. In the current deployed web app, there are **no active `/api/` endpoints connecting to this worker**; it represents an experimental backend prototype.

The goal of this upgrade is to transform PulseCut into **PulseCut AI — Intelligent Clipping Studio**, integrating dual-source ingestion (local upload + direct media URL with CORS intelligence), automatic highlight detection, dedicated GTA VI & gaming clipping intelligence, natural-language "Find Moments" search, client-side transcription, multi-ratio smart reframing, and batch MP4 export — all maintained with **zero mandatory paid AI APIs or cloud infrastructure costs**.

---

## 2. Codebase Structure & Workspace Inventory

| Directory / Package | Purpose | Status | Audit Findings |
|---|---|---|---|
| `apps/web` | Next.js 15 App Router Frontend | **Production Ready** | Builds cleanly (`output: 'export'`). Studio is functional for local file uploads, mathematical splitting, kinetic subtitles, and WebCodecs MP4 rendering. |
| `packages/shared` | Core calculation logic and schemas | **Production Ready** | Tests passing (7/7 suites). Handles clip splitting calculations (`calculateClips`), duration formatting, and Zod schemas. |
| `packages/platform-presets` | Social platform dimension & safe-zone presets | **Production Ready** | Complete definitions for Shorts, TikTok, Reels, X, Threads, and Universal. |
| `packages/video-config` | Framerate, bitrate, resolution & theme configurations | **Production Ready** | Cleanly exports standard bitrates, 1080p/2K/4K resolutions, and 12 subtitle themes. |
| `services/media-worker` | Node.js FFmpeg BullMQ worker | **Dormant / Experimental** | Compiles with `tsc`, but is decoupled from the web app. Web app operates without any server-side video worker. |
| `prisma` | Database schema for users, projects, clips | **Dormant / Unused in Web** | Web app runs client-side and does not invoke Prisma or require a database for video processing. |
| `scripts` | Asset generation scripts | **Utility** | `generate_favicons.js` creates multi-resolution web icons. |

---

## 3. Detailed Component & Feature Audit

### 3.1 What Works (Preserved Baseline)
1. **Client-Side WebCodecs Engine (`videoEngine.ts`):**
   - High-throughput sequential demuxing using Mediabunny (`MP4`, `QTFF`, `WEBM`, `MATROSKA` singletons).
   - Canvas-based visual compositing with 8 reframing strategies (Center, Face Focus, Speaker Focus, Gameplay, Fit+Blur, Left, Right, Manual).
   - Web Audio API pipeline (`decodeAudioData` into Float32Array PCM buffer) -> AAC hardware encoder.
   - mp4-muxer container generation with proper timescale, synchronization, and zero-loss audio.
   - Direct-to-disk File System Access API streaming for large video files without running out of RAM.
   - Transactional fallback to `<video>` element seek events when WebCodecs demuxing fails.
2. **Kinetic Subtitle Engine (`subtitles.ts`):**
   - 12 styled themes (Creator Punch, Bold Yellow, Active Word Highlight, Clean White, Karaoke Beat, Gaming, Neon, etc.).
   - Binary-search cue lookup $O(\log n)$ per frame.
   - Real-time animated canvas drawing (glow, pop, bounce, shadows).
   - SRT and VTT export functions.
3. **Hardware Capability Detection (`deviceDetector.ts`):**
   - Tests `VideoEncoder.isConfigSupported()` for AVC1 profiles (`avc1.640033`, `avc1.4d4028`, `avc1.42e01e`).
   - Assesses device memory, CPU concurrency, canvas dimension limits, WebGPU, and OPFS.
4. **Heuristic AI Engine (`localAI.ts`):**
   - TF-IDF keyword extraction and topic categorization.
   - Rule-based high-retention hook generation across 12 distinct psychology categories.
   - Heuristic engagement potential scoring (first-seconds hook, dead air ratio, pacing note).

### 3.2 Incomplete & Broken Features
1. **Project Persistence (`projectStore.ts`):**
   - Uses Node.js `node:fs` and `node:path` targeting a local `../../data/projects.json` file.
   - **Critical limitation:** In client-side production / Vercel static deployment, Node.js `fs` cannot run in the browser. Browser users need an **IndexedDB** client-side storage engine to persist projects, clips, and settings across reloads.
2. **Missing Video Ingestion Modalities:**
   - The studio currently only accepts local file inputs (`videoFile: File`).
   - There is no direct media URL import, CORS testing, range validation, or platform-assisted import workflow.
3. **No Automatic Highlight / AI Clipping Detection:**
   - The current clip generation divides video strictly by mathematical interval (e.g., 30s chunks).
   - It lacks acoustic energy peak detection, pause/silence boundary alignment, visual scene change detection, and gameplay intensity analysis.
4. **No GTA VI / Gaming Highlight Mode:**
   - Gaming content needs detection of sudden audio volume bursts (explosions, reactions, shoutouts), scene transitions, facecam activity, and HUD preservation. Currently, reframing is static or sinusoidal panning.
5. **No Natural-Language "Find Moments" Feature:**
   - Missing semantic or keyword-indexed moment search across dialogue and scene metadata.
6. **No Real-Time Browser Speech-to-Text Transcription:**
   - Subtitles are currently seeded with preset/sample cue data rather than derived from the user's actual audio track.

---

## 4. Dependencies & Security Audit

- **Core Dependencies:** Next.js 15.1.7 (Next 15.5.27 in lockfile), React 19.0.0, Mediabunny 1.61.0, mp4-muxer 5.2.2, Tailwind CSS 3.4.17.
- **Security Check:**
  - Zero server-side file upload vulnerabilities because video processing is client-side.
  - Zero SSRF risk currently because no server-side fetching exists. When adding URL importing, browser-side fetch must be used by default; any server-side helpers must have strict private IP / SSRF blocking.
  - Sensitive files (`.env.local`) contain expired or test tokens only; must ensure no secrets are exposed in client builds.

---

## 5. Performance Bottlenecks & Optimization Targets

1. **Large Video Memory Pressure:** Decoding long audio into an uncompressed `AudioBuffer` for videos over 30 minutes can consume 500MB–1GB RAM. Streaming or windowed audio extraction is required for long files.
2. **Offscreen Canvas Rendering:** Moving canvas compositing to a Web Worker keeps the main UI thread at a responsive 60 FPS during heavy batch encoding.
3. **Browser Codec Compatibility:** Not all browsers support H.264 High Profile hardware encoding; automatic fallback to Baseline profile or software rendering must remain robust.

---

## 6. Migration & Upgrade Plan Summary

To achieve the requirements without breaking any existing functionality:
1. Preserve `videoEngine.ts`, `subtitles.ts`, `deviceDetector.ts`, and `@shorts/*` packages.
2. Build a modular **Dual-Source Ingestion Layer** (`apps/web/src/features/ingestion`) supporting Local File, Direct Media URL (with CORS checks & progress), and Manual-Assisted Platform Guidance.
3. Build an **IndexedDB Project & Clip Store** replacing the Node.js `fs` store for client-side persistence.
4. Implement an **Audio & Scene Analysis Engine** to detect audio peaks, silence pauses, and scene transitions to drive real AI Clipping.
5. Create a dedicated **Gaming Clipping Studio** with tailored presets for GTA VI Gameplay, Open World, FPS, and Commentary.
6. Implement **Find Moments** natural language query filtering on transcripts and detected scene events.
7. Add client-side speech recognition support and word-level subtitle generation.
8. Update the studio UI to a futuristic, dark media-production workspace.
