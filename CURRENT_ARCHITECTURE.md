# PulseCut AI — Current Architecture Documentation

**Application:** PulseCut AI (Intelligent Clipping Studio)  
**Parent Brand:** Code With Bitwizards  
**Architecture Type:** Client-Side Local-First Video Processing Engine + Monorepo Shared Utilities  

---

## 1. System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER / CLIENT                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌───────────────────────┐         ┌────────────────────────────────┐  │
│  │   UI Layer (Next 15)  │         │  Local Ingestion & Discovery   │  │
│  │   - Studio Workspace  │ ◄───────┤  - Local File Picker / DnD     │  │
│  │   - Clip Cards / Play │         │  - (Target: URL Import / CORS) │  │
│  │   - Safe-Zone Overlay │         └────────────────────────────────┘  │
│  │   - Subtitle Editor   │                                             │
│  └───────────┬───────────┘                                             │
│              │                                                         │
│              ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Browser Processing Core (videoEngine.ts)         │  │
│  │                                                                  │  │
│  │   ┌────────────────────┐   Demux    ┌─────────────────────────┐  │  │
│  │   │     Mediabunny     ├───────────►│ Sequential VideoSample  │  │  │
│  │   │ (MP4/WEBM/QTFF/MKV)│            │ Iterator                │  │  │
│  │   └────────────────────┘            └────────────┬────────────┘  │  │
│  │                                                  │ Draw          │  │
│  │   ┌────────────────────┐   Decode   ┌────────────▼────────────┐  │  │
│  │   │   Web Audio API    ├───────────►│ OffscreenCanvas 60 FPS  │  │  │
│  │   │  (PCM Float32Array)│            │ - Aspect Crop / Reframe │  │  │
│  │   └──────────┬─────────┘            │ - Animated Subtitles    │  │  │
│  │              │                      │ - Vignette & Overlays   │  │  │
│  │              │                      └────────────┬────────────┘  │  │
│  │              │                                   │ VideoFrame    │  │
│  │              ▼                                   ▼               │  │
│  │   ┌────────────────────┐            ┌─────────────────────────┐  │  │
│  │   │ AudioEncoder (AAC) │            │ VideoEncoder (H.264)    │  │  │
│  │   └──────────┬─────────┘            └────────────┬────────────┘  │  │
│  │              │                                   │               │  │
│  │              └───────────────┬───────────────────┘               │  │
│  │                              ▼                                   │  │
│  │                   ┌───────────────────────┐                      │  │
│  │                   │    mp4-muxer (v5)     │                      │  │
│  │                   │ - ArrayBufferTarget   │                      │  │
│  │                   │ - FileSystemTarget    │                      │  │
│  │                   └──────────┬────────────┘                      │  │
│  │                              │                                   │  │
│  │                              ▼                                   │  │
│  │                   ┌───────────────────────┐                      │  │
│  │                   │ Finished MP4 Download │                      │  │
│  │                   └───────────────────────┘                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Client-Side Intelligence (localAI.ts)            │  │
│  │  - TF-IDF Keyword & Topic Extraction                             │  │
│  │  - 12-Category Hook Generation (Curiosity, Story, Mistake, etc.) │  │
│  │  - Heuristic Engagement & Virality Scoring                       │  │
│  │  - Social Metadata (Hashtags, SEO Title, Descriptions)           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion & Source Handling

Currently, ingestion is handled inside `apps/web/src/app/studio/page.tsx`:
- Accepts `File` objects through HTML drag-and-drop or `<input type="file" accept="video/*">`.
- Generates an ephemeral Object URL via `URL.createObjectURL(file)`.
- Loads metadata into an `<video>` element (`duration`, `videoWidth`, `videoHeight`).
- Calculates frame rate via Mediabunny demuxer (`computeFrameRateMetrics()`) or defaults to 30 FPS.

---

## 3. Video Processing & Encoding Pipeline

The client-side engine in `apps/web/src/lib/videoEngine.ts` contains two paths:

### 3.1 Primary Path: Mediabunny Sequential Demux
1. **Input File:** Opened using Mediabunny's `Input` with format singletons (`MP4`, `QTFF`, `WEBM`, `MATROSKA`).
2. **Audio Decoding:** The audio track is fed into `AudioContext.decodeAudioData()`. An interleaved `Float32Array` buffer is computed and sliced for each clip's time range `[startTime, endTime]`.
3. **Video Demux & Frame Extraction:** `VideoSampleSink.samples()` iterates sequentially through samples within the target timeframe.
4. **Compositing:** Each `VideoSample.draw()` is rendered onto a canvas matching the target resolution (e.g., 1080×1920 for 9:16).
5. **Crop & Reframe:** `calculateReframeCrop()` computes coordinates based on selected strategy (`AI Smart`, `Center`, `Face Focus`, `Gameplay`, etc.).
6. **Subtitles & Overlays:** `drawSubtitlesOnCanvas()` executes per-frame binary search on active cues and renders animated typography.
7. **Encoding:** Canvas emits `VideoFrame` instances into `VideoEncoder` (configured for AVC1 H.264 profile). Audio samples are fed to `AudioEncoder` (configured for AAC).
8. **Muxing:** Encoded chunks are written into `mp4-muxer`. Output is returned as a `Blob` or streamed to disk using `FileSystemWritableFileStreamTarget`.

### 3.2 Fallback Path: HTMLVideoElement Seek
If Mediabunny decoding fails or WebCodecs demuxing is unavailable:
- The engine creates a transactional fallback pipeline.
- Uses `HTMLVideoElement.currentTime` seeking / `requestVideoFrameCallback` to composite frames onto the canvas.
- Encodes and muxes independently, ensuring no partial sequential output is mixed into fallback outputs.

---

## 4. Packages & Monorepo Architecture

1. **`@shorts/shared`:**
   - `clipMath.ts`: Computes clip boundaries based on total duration, selected clip duration (15s–180s), and remainder strategies (`ignore`, `shorter-final`, `redistribute`, `controlled-overlap`).
   - `filenameGenerator.ts`: Generates structured filenames: `[Topic]_[Duration]s_[Aspect]_[Index].mp4`.
   - `schemas.ts`: Zod schema validation for project metadata.
2. **`@shorts/platform-presets`:**
   - Platform dimension constants, maximum clip durations, aspect ratios, and safe-zone margin percentages for YouTube Shorts, TikTok, Instagram Reels, X, Threads, and Universal.
3. **`@shorts/video-config`:**
   - Presets for video quality tiers (`1080p`, `2k`, `4k`), framerates (30 / 60 FPS), and 12 kinetic subtitle themes.

---

## 5. Storage & Persistence State

- **Current State:** `apps/web/src/lib/projectStore.ts` attempts to read/write `data/projects.json` via Node.js `fs`. This works in local Node environments but fails in pure browser runtime.
- **Target Architecture:** Move client persistence to **IndexedDB** using a browser-compatible store (`idb` or native IndexedDB API). Large source video files are kept as references or cached in OPFS (Origin Private File System) where supported, while clip metadata and editing configurations persist reliably across sessions.
