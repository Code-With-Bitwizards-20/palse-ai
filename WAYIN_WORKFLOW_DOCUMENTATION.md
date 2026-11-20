# WayinVideo Workflow Documentation

This document records the user interaction sequences and state transitions observed from WayinVideo's product workflows.

---

## 1. Video Ingestion Sequence

```
[User Arrives]
      │
      ├─► Action A: Paste Video Link (YouTube, Twitch, TikTok, etc.)
      │        │
      │        ▼
      │   Validate URL & Format
      │        │
      │        ▼
      │   Show Thumbnail / Duration Preview
      │
      └─► Action B: Upload Local Video File (Drag & Drop or File Browser)
               │
               ▼
          Validate Format & Size
               │
               ▼
          Local Pre-probe (Codec, Resolution, FPS)
```

### Key UI States
- **Empty State:** High-contrast dual dropzone / URL input bar with supported platform icons (YouTube, Twitch, Vimeo, TikTok, MP4).
- **Validating State:** Pulse animation checking media accessibility and metadata.
- **Error State:** Distinct messages for invalid URL, unreachable host, CORS restriction, or unsupported video format.
- **Success State:** Displays video title, source duration, resolution badge, and audio indicator with a "Configure Clips" button.

---

## 2. AI Clipping Configuration & Generation

```
[Source Confirmed]
      │
      ├─► Select Clipping Mode:
      │     - [AI Clipping]: General dialogue / context summarizer
      │     - [Game Clipping]: Stream highlights & action burst detection
      │     - [Find Moments]: Natural-language query search
      │
      ├─► Configure Constraints:
      │     - Clip Duration: 15s | 30s | 45s | 60s | 90s | Custom
      │     - Number of Clips: 3 | 5 | 10 | 15 | All High-Value
      │     - Reframe Aspect: 9:16 (Shorts/Reels) | 1:1 | 16:9 | 4:5
      │
      ▼
[Process Video]
      │
      ├─► Stage 1: Audio track extraction & waveform RMS analysis
      ├─► Stage 2: Scene transition & visual activity detection
      ├─► Stage 3: Sentence boundary & pause detection
      ├─► Stage 4: Candidate scoring & ranking
      │
      ▼
[Results Presentation]
      - Candidate Clip Cards grid
      - Clip Quality Score (0–100) with metric breakdown
      - Hook Headline Preview
      - Start & End Trim Timestamps
      - Safe-Zone Visual Preview
```

---

## 3. Clip Review, Editing & Export

```
[Clip Card Selected]
      │
      ├─► Quick Actions:
      │     - Instant Play/Pause with loop preview
      │     - Safe-zone toggle (Shorts, TikTok, Instagram Reels)
      │     - One-click MP4 Download
      │
      └─► "Customize / Edit" Modal:
            - Interactive start/end time sliders
            - Hook copy generator & selector
            - Subtitle style switcher (12 Kinetic Themes)
            - Manual reframe pan slider (0% to 100% horizontal offset)
            - Safe-zone bounding guides
      │
      ▼
[Export Studio]
      - Single Clip Render or Batch Render All
      - Real-time percentage & frame count counter
      - WebCodecs GPU encoding (H.264 + AAC)
      - Instant save to browser disk / OPFS streaming
```
