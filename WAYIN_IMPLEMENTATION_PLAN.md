# WayinVideo Implementation Mapping for PulseCut AI

How PulseCut AI implements the functional equivalents of WayinVideo using 100% free and open-source browser technologies.

---

## 1. Feature-by-Feature Engineering Mapping

| WayinVideo Functional Component | PulseCut AI Implementation Architecture | Implementation File |
|---|---|---|
| **Dual Ingestion (URL + Upload)** | Unified Source Adapter pattern: `LocalFileAdapter`, `DirectMediaAdapter`, `ManualAssistedAdapter`. Checks CORS, probes container metadata, and handles errors gracefully. | `apps/web/src/features/ingestion/` |
| **Highlight Detection Engine** | RMS audio energy analysis via Web Audio `AudioBuffer` + visual scene difference detection by sampling downscaled canvas frames. Identifies action peaks, applause, laughter, or voice intensity. | `apps/web/src/lib/highlightDetector.ts` |
| **Gaming Clipping Engine** | Specialized detection profile tailored for GTA VI, open-world games, and FPS shooters. Detects rapid audio volume shifts (gunfire, sirens, crashes, commentary yells) and protects HUD/facecam regions. | `apps/web/src/lib/gamingClipper.ts` |
| **"Find Moments" AI Search** | Search engine indexing timestamped transcript segments and detected scene activity. Resolves queries such as *"jumpscare"*, *"funny moment"*, *"fast car"*, or specific dialogue phrases. | `apps/web/src/features/moments/` |
| **Clip Quality Scoring** | Transparent 0–100 scoring system evaluating: Hook Strength (30%), Audio Energy & Clarity (25%), Visual Activity (25%), and Pacing/Punctuation (20%). | `apps/web/src/lib/localAI.ts` |
| **Kinetic Subtitle Engine** | 12 typography templates drawn directly onto canvas frames during compositing: Creator Punch, Bold Yellow, Word Highlight, Karaoke, Neon, Gaming, Minimal, etc. | `apps/web/src/lib/subtitles.ts` |
| **Smart Reframing** | Multi-ratio conversion (9:16, 16:9, 1:1, 4:5) with 8 reframing strategies: Center, AI Smart, Face Focus, Speaker Focus, Gameplay Focus, Fit+Blur, and Manual Pan. | `apps/web/src/lib/videoEngine.ts` |
| **Batch MP4 Rendering** | GPU-accelerated WebCodecs `VideoEncoder` (H.264) + `AudioEncoder` (AAC) muxed via `mp4-muxer` into compliant MP4 files. | `apps/web/src/lib/videoEngine.ts` |
| **Project Persistence** | Client-side `IndexedDB` database storing project metadata, user clips, subtitle customizations, and export logs. | `apps/web/src/lib/indexedDBStore.ts` |
