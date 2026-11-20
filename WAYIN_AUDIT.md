# WayinVideo Functional Audit

**Auditor:** PulseCut AI Architecture Team  
**Subject:** WayinVideo (Public Reference Platform)  
**Target URLs:** `https://wayin.ai/wayinvideo/`, `https://help.wayin.ai/`  
**Methodology:** Public web documentation review, developer skill/API specification analysis, and REA inspection.  

---

## 1. Executive Summary

WayinVideo is a commercial, cloud-backed AI video summarization and clipping platform designed to convert long-form horizontal videos (podcasts, gaming streams, webinars, interviews, YouTube VODs) into short-form vertical videos (TikTok, YouTube Shorts, Instagram Reels).

WayinVideo operates on a cloud-credit model:
- Users paste a video link or upload a file.
- Cloud servers download/process the video using proprietary AI models (speech transcription, visual scene segmentation, LLM-based hook scoring).
- Users review generated clip cards with viral scores, edit captions/layouts in a cloud-hosted video editor, and export rendered MP4s.

For **PulseCut AI**, our goal is **functional parity** without the cloud cost, server GPUs, or paid API keys — utilizing browser WebCodecs, Web Audio API, Mediabunny, and local heuristic intelligence on the user's device.

---

## 2. Core Functional Workflows Identified

| Workflow | WayinVideo Cloud Behavior | PulseCut AI Free-First Implementation |
|---|---|---|
| **1. Video Ingestion** | Pastes YouTube/Vimeo/Twitch/TikTok URLs or uploads MP4/MOV to cloud bucket. | **Dual-Source Ingestion:** Local file upload (100% private) + Direct CORS media URL import + platform export guide. |
| **2. AI Clipping** | Cloud GPU transcribes audio and generates highlight segments based on LLM dialogue analysis. | **Local Acoustic & Scene Engine:** Evaluates RMS audio energy peaks, silence boundaries, and canvas frame differences. |
| **3. Game Clipping** | Specialized gaming highlight detection for streams and VODs. | **GTA VI & Gaming Engine:** Audio burst detection (explosions, reactions), scene jump cuts, and HUD safe-zone protection. |
| **4. Find Moments** | Natural language search querying cloud video embeddings. | **Transcript & Metadata Intelligence:** Keyword and regex matching over timestamped cues and scene tags. |
| **5. Clip Scoring** | Proprietary "Viral Score" (0–100) with Hook, Story, Value, Engagement, and Reach breakdown. | **Transparent Heuristic Quality Score (0–100):** Evaluates Hook strength, dead-air ratio, visual activity, and pacing. |
| **6. Subtitles & Captions** | Cloud Whisper/STT with animated kinetic presets. | **Client-Side Subtitle Engine:** 12 animated themes (Karaoke, Creator Punch, TikTok Bold) rendered via OffscreenCanvas. |
| **7. Smart Reframing** | Cloud face tracking converting 16:9 to 9:16. | **Multi-Ratio Dynamic Reframe:** AI Smart, Center, Face/Speaker Focus, Gameplay, Manual Pan Offset across 9:16, 1:1, 16:9, 4:5. |
| **8. Export** | Cloud FFmpeg server-side render queue. | **Browser WebCodecs MP4 Muxer:** Direct hardware H.264/AAC render at 60 FPS with zero cloud fees. |

---

## 3. Product Modes in WayinVideo

1. **AI Clipping Mode:**
   - General-purpose dialogue and visual summarizer.
   - User configures target duration (15s, 30s, 60s, 90s) and language.
   - Outputs ranked candidate cards with thumbnails, timestamps, and hook titles.
2. **Game Clipping Mode:**
   - Focuses on gameplay recordings, commentary, and stream highlights.
   - Prioritizes sudden audio spikes, player reaction volume, and visual combat/action pacing.
3. **Find Moments Mode:**
   - Search bar where users type semantic queries (e.g. *"Show when the streamer gets jumpscared"*, *"Find the conversation about the new release"*).
   - Jumps directly to matching timestamp intervals.

---

## 4. Verification of Findings vs. Assumptions

- **Verified Facts:**
  - WayinVideo requires paid credits/subscriptions for cloud processing beyond limited trial quotas.
  - Video downloading on WayinVideo relies on server-side scraping proxies that frequently break when platforms update DRM or anti-bot algorithms.
  - Its rendering happens asynchronously on server infrastructure with status webhooks/polling.
- **Assumptions Separated:**
  - We do not know the exact proprietary weights of WayinVideo's viral scoring model; our implementation uses clear, documented heuristic formulas (Hook potential + Audio clarity + Visual activity + Context preservation).
