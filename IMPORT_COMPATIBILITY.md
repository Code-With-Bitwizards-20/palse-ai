# PulseCut AI — Video Import & Ingestion Compatibility Matrix

**Architecture:** Client-Side Dual-Source Ingestion Engine  
**Host Application:** PulseCut AI  

---

## 1. Supported Ingestion Sources

| Source Format / Platform | Ingestion Strategy | Browser Compatibility | CORS / DRM Limitations | Free / Local Status |
|---|---|---|---|---|
| **Local MP4 File** | Drag & Drop / File Picker | Chrome, Edge, Safari, Firefox | **None** (Direct disk access via File API) | **100% Free & Local** |
| **Local WebM File** | Drag & Drop / File Picker | Chrome, Edge, Firefox | **None** | **100% Free & Local** |
| **Local MOV File** | Drag & Drop / File Picker | Chrome, Safari, Edge | **None** | **100% Free & Local** |
| **Local MKV File** | Drag & Drop (Mediabunny demux) | Modern Chromium / Desktop | **None** | **100% Free & Local** |
| **Direct Media URL (`.mp4`, `.webm`)** | Browser `fetch()` + Range Stream | All modern browsers | Server must provide `Access-Control-Allow-Origin: *` | **100% Free (Client-side)** |
| **YouTube Videos / VODs** | Assisted Creator Download Guidance | All devices | Protected by CORS and platform terms; users download via YouTube Studio | **100% Free & Compliant** |
| **Twitch Broadcasts / VODs** | Assisted Creator Download Guidance | All devices | Segmented HLS; users export via Twitch Video Producer | **100% Free & Compliant** |
| **TikTok Videos** | Assisted Creator Download Guidance | All devices | Protected by CORS and CDN tokenization | **100% Free & Compliant** |

---

## 2. Security & Protocol Enforcement

The ingestion validator (`apps/web/src/features/ingestion/services/url-validator.ts`) enforces strict safety checks:
1. **Scheme Validation:** Rejects `javascript:`, `file:`, `data:`, `blob:`, `ftp:`. Only `http:` and `https:` are permitted.
2. **SSRF Guard:** No arbitrary server-side proxies. All network requests originate from the user's browser, preventing internal IP probing or server-side request forgery.
3. **CORS Pre-flight Inspection:** Uses lightweight `HEAD` requests to verify CORS compliance before allocating download memory.
4. **Abort Support:** Direct media downloads can be cancelled at any time by the user, immediately releasing memory.
