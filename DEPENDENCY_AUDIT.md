# PulseCut AI — Dependency Audit

**Repository:** `palse-ai`  
**Node.js Version:** `v22.23.5`  
**Package Manager:** `npm 11.8.0`  

---

## 1. Production Dependencies (`apps/web/package.json`)

| Package | Version | Purpose | Free / License | Assessment |
|---|---|---|---|---|
| `next` | `^15.1.7` (15.5.27) | Web Application Framework | MIT (Free) | Production core. Configured for static export or Vercel serverless. |
| `react`, `react-dom` | `^19.0.0` | UI Library | MIT (Free) | React 19 concurrent features. |
| `mediabunny` | `^1.61.0` | Browser Demuxing & Decoding | MIT (Free) | Fast sequential demux for MP4, QTFF, WebM, Matroska. |
| `mp4-muxer` | `^5.2.2` | In-Browser MP4 Container Muxer | MIT (Free) | Hardware-accelerated H.264/AAC muxing without server. |
| `lucide-react` | `^0.475.0` | UI Iconography | MIT (Free) | Tree-shaken icons. |
| `tailwindcss` | `^3.4.17` | Utility-First Styling | MIT (Free) | Dark mode & glassmorphism system. |
| `clsx`, `tailwind-merge` | Latest | Classname composition | MIT (Free) | Utility helpers. |
| `zod` | `^3.24.2` | Runtime Schema Validation | MIT (Free) | Project and clip validation. |
| `archiver` | `^7.0.1` | ZIP File Creation | MIT (Free) | Server-side utility (tree-shaken out of client bundle). |
| `@prisma/client`, `prisma` | `^6.4.1` | Database ORM | Apache-2.0 | Excluded from client bundle via `serverExternalPackages`. |

---

## 2. Shared Workspace Dependencies

| Workspace Package | Version | Dependents | Role |
|---|---|---|---|
| `@shorts/shared` | `1.0.0` | `apps/web` | Mathematical splitting (`clipMath`), duration formatters, Zod schemas. |
| `@shorts/platform-presets` | `1.0.0` | `apps/web`, `@shorts/shared` | Platform safe-zones, aspect ratios, max durations. |
| `@shorts/video-config` | `1.0.0` | `apps/web` | Resolution tiers, bitrates, 12 subtitle theme configurations. |

---

## 3. Recommended New Dependencies (100% Free & Open Source)

To complete the Intelligent Clipping Studio without paid APIs:
1. **`idb` (v8.x):** Minimal, promise-based wrapper over browser `IndexedDB` for client-side project and clip persistence. Zero cost, lightweight (< 2 KB).
2. **Optional: `@xenova/transformers` (Transformers.js):** Browser-native ONNX runtime for client-side Whisper speech recognition models (e.g. `whisper-tiny` or `whisper-base`) running via WebGPU / WebAssembly. Downloaded only upon explicit user consent.

---

## 4. Zero Paid API Guarantee

No external services requiring credit cards, monthly subscriptions, or paid API keys will be introduced:
- **No OpenAI Whisper API** -> In-browser audio peak detection + browser speech recognition / optional Transformers.js.
- **No paid Cloudflare/AWS GPU rendering** -> In-browser WebCodecs GPU encoding via user's graphics hardware.
- **No paid stock media / transcription subscriptions** -> 100% local processing.
