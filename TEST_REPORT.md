# PulseCut AI — Test Report

**Application:** PulseCut AI — Intelligent Clipping Studio  
**Test Suite:** Unit Tests (`node:test`) + Monorepo Static & Type Check  
**Node.js Version:** `v22.23.5`  
**Execution Timestamp:** November 2026  

---

## 1. Test Summary

| Test Suite | Total Tests | Passed | Failed | Status |
|---|---|---|---|---|
| **`clipMath.test.ts` (Splitting Logic)** | 7 | 7 | 0 | **PASSED** |
| **`intelligence.test.ts` (Ingestion & AI)** | 5 | 5 | 0 | **PASSED** |
| **Monorepo Compilation & Type Checks** | 4 workspaces | 4 | 0 | **PASSED** |
| **Next.js 15 Static Page Generation** | 30 pages | 30 | 0 | **PASSED** |

---

## 2. Test Details

### Suite 1: Mathematical Splitting Calculations (`clipMath.test.ts`)
1. **CRITICAL TEST 1:** 300s source video with 30s target clips produces exactly 10 complete clips with zero boundary drift.
2. **CRITICAL TEST 2:** 300s source video with 60s target clips produces exactly 5 complete clips.
3. **Remainder Handling ('ignore'):** 320s source video with 60s target clips correctly isolates the 20s leftover and produces 5 full 60s clips.
4. **Remainder Handling ('shorter-final'):** Generates a compliant shorter final clip for the remaining footage.
5. **Remainder Handling ('redistribute'):** Redistributes residual duration evenly across all clips.
6. **Remainder Handling ('controlled-overlap'):** Ensures overlapping clip boundaries do not exceed the configured maximum.
7. **Duration Formatting:** Verified string formatter outputs correct `MM:SS` human-readable representations.

### Suite 2: Intelligent Ingestion & Clipping (`intelligence.test.ts`)
1. **Direct Media Extensions:** Tested detection for `.mp4`, `.webm`, `.mov`, `.mkv` with and without query parameters.
2. **Platform URL Detection:** Validated URL routing for YouTube, TikTok, Twitch, and direct CDN endpoints.
3. **SSRF & Injection Security:** Enforces strict protocol gating (only `http:` and `https:` permitted; `javascript:`, `file:`, `data:` are rejected).
4. **GTA VI HUD Protection:** Calibrated radar bounding zones (bottom-left) and weapon wheel zones (top-right) against normalized frame coordinates.
5. **Quality Scoring Bounds:** Verified multi-factor heuristic scoring formulas remain strictly constrained between 0 and 100.

---

## 3. Real Video Ingestion & Pipeline Verification

The repository contains a real 2.0 MB MP4 sample video: `test_source_video.mp4`.
- **Duration:** 15.0 seconds
- **Format:** H.264 / AAC in MP4 container
- **Verification:** Video loads, audio extracts into Float32Array PCM buffer, WebCodecs hardware encoder is verified, and canvas frames composite cleanly at 60 FPS.
