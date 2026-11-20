# PulseCut AI — Security & Privacy Audit

**Application:** PulseCut AI — Intelligent Clipping Studio  
**Classification:** Local-First In-Browser Media Processor  

---

## 1. Privacy Architecture (Zero Cloud Storage)

- **Zero Media Uploads:** User video files remain exclusively inside browser sandboxed memory (Blob / File / ArrayBuffer). No video data is ever transmitted to Vercel, cloud servers, or third-party storage.
- **Zero Telemetry on Media:** No frame extraction or audio samples are sent to external cloud APIs (no OpenAI, Gemini, or Anthropic network requests).
- **Client-Side Persistence:** Project records, clip boundaries, and user edits are stored exclusively in the user's local browser **IndexedDB** (`PulseCutAI_Studio`).

---

## 2. URL & Network Ingestion Security

1. **SSRF Guard:** The application does not proxy arbitrary URLs through a server-side route. All direct media URL requests execute via client-side `fetch()`. The serverless backend cannot be exploited as a request proxy.
2. **Protocol Allowlisting:** URL parsing strictly enforces `http:` and `https:`. Schemes like `javascript:`, `file:`, `data:`, `vbscript:`, and `blob:` are explicitly rejected.
3. **CORS Enforcement:** The browser's native Same-Origin Policy and Cross-Origin Resource Sharing protections prevent malicious origins from being read without server consent.
4. **Safe-Zone Overlays:** Platform safe zones and visual annotations are rendered only in the editing viewport and are never burned into the final export unless explicitly requested.
