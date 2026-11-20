# PULSECUT CURRENT SOURCE AUDIT
**PulseCut AI — Video to Shorts Cloud Platform**
**Audited Commit:** `16f0c8204aec1b36d474c7b4e042a92cf2952f7a` (branch `main`)
**Date:** 2026-11-21
**Developer:** Code With Bitwizards

---

## 1. Executive Summary

This audit evaluates the codebase against the non-negotiable requirement: **100% remote cloud media processing with zero client-side CPU/GPU media rendering, transcription, or audio decoding**.

The audit confirms that while commit `16f0c82` improved UI branding copy and fixed Next.js webpack build failures, several critical architectural defects and local processing paths remain in the source code:

1. **Client-Side Audio Decoding & Highlight Calculation in Studio (`studio/page.tsx`):**
   - The studio page imports `detectCandidateHighlights` and `generateGamingHighlights`.
   - Lines 374–390 decode the video's audio track on the user's computer using `file.arrayBuffer()` and `AudioContext.decodeAudioData()`.
   - Lines 252–285 calculate AI candidate timestamps in a browser-side React effect.
2. **Misleading YouTube 422 Error Handling:**
   - In `apps/web/src/lib/sourceAdapters.ts`, the YouTube adapter intentionally returns `allowed: false` with code `YOUTUBE_DIRECT_STREAM_RESTRICTED`.
   - In `apps/web/src/app/api/upload/url/route.ts`, this returns HTTP 422 before the media worker is ever contacted.
   - In `apps/web/src/app/studio/page.tsx` line 436, `handleUrlImport()` throws a generic error on any non-2xx response, setting `workerError`.
   - The UI then renders: `"Cloud worker is currently unavailable."` — misleading the user into thinking the cloud worker crashed when in reality the URL was rejected by the source policy.
3. **Mock Data in Media Worker (`services/media-worker/src/aiProvider.ts`):**
   - The `StructuredAIProvider.transcribeAudio()` method uses hardcoded sentences: *"In this video, we are breaking down the exact strategy..."* instead of running real speech recognition.
   - The pipeline creates clips via mathematical division (`calculateClips()`) rather than genuine acoustic/speech event detection.
4. **Database Configuration Discrepancy:**
   - `prisma/schema.prisma` declares `provider = "sqlite"`, whereas deployment configurations and `.env.example` specify PostgreSQL.

---

## 2. File-by-File Audit Findings

### A. Frontend (`apps/web/src/app/studio/page.tsx`)
| Issue | Code Line | Severity | Description |
|---|---|---|---|
| Client `AudioContext` | Lines 375–377 | **CRITICAL** | `const ctx = new AudioContext(); ctx.decodeAudioData(ab)` decodes audio PCM samples on user's CPU. |
| Client RMS Peak Detection | Lines 380–389 | **CRITICAL** | Computes audio RMS windows and extracts peak timestamps in the browser. |
| Client Highlight Detector | Lines 252–258 | **CRITICAL** | Calls `detectCandidateHighlights()` with client audio buffer in browser state. |
| Client Gaming Clipper | Lines 220–251 | **CRITICAL** | Calls `generateGamingHighlights()` in client state. |
| URL Import Generic Error | Lines 435–442 | **HIGH** | Throws `Error('URL import failed: 422')`, converting policy rejections into worker outages. |
| Misleading Worker Banner | Lines 617–626 | **HIGH** | Banner title hardcoded to *"Cloud worker is currently unavailable."* for any error. |

### B. URL Ingestion & Adapters (`apps/web/src/lib/sourceAdapters.ts`)
- **YouTube Adapter:** Correctly flags that arbitrary YouTube stream extraction violates platform policies (`YOUTUBE_DIRECT_STREAM_RESTRICTED`).
- **Defect:** Does not provide an official YouTube embedded iframe preview or timestamp clipping workflow for creators referencing YouTube content.

### C. Media Worker (`services/media-worker/src/`)
| File | Component | Finding |
|---|---|---|
| `aiProvider.ts` | `StructuredAIProvider` | Hardcoded 8 sample sentences repeated sequentially. No real ASR execution. |
| `pipeline.ts` | `runMediaPipeline` | Splits media by mathematical interval `durationSeconds / selectedDurationSeconds` without acoustic landmark alignment. |
| `server.ts` | Job Management | In-memory `Map<string, JobState>` without Redis/BullMQ persistence. |
| `server.ts` | Security | `Access-Control-Allow-Origin: *` without `WORKER_SECRET` authorization check. |

### D. Database (`prisma/schema.prisma`)
- Datasource provider is set to `"sqlite"`. Must support production PostgreSQL deployment.

---

## 3. Required Action Plan

1. **Refactor `studio/page.tsx`:**
   - Remove `AudioContext`, `decodeAudioData`, `AudioBuffer`, and client highlight algorithms.
   - Update `handleUrlImport()` to parse JSON responses and provide dedicated YouTube timestamp preview vs. direct upload guidance.
   - Implement the YouTube embedded player with timestamp markers (Start/End, title, notes, exportable chapter list).
2. **Upgrade Media Worker (`services/media-worker`):**
   - Implement real audio extraction (`ffmpeg -vn -ar 16000 -ac 1 output.wav`).
   - Implement real acoustic energy & silence detection (`silencedetect`, `ebur128`) to find genuine video highlights, volume spikes, and sentence pauses.
   - Remove fake placeholder sentences from `aiProvider.ts`.
   - Add worker authentication (`x-worker-secret`).
3. **Add Automated Test Suite:**
   - Verify zero client `AudioContext` usage in studio.
   - Verify YouTube 422 error classification and UI mapping.
   - Verify worker acoustic event detection and highlight generation.
