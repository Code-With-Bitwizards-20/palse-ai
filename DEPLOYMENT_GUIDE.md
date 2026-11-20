# PulseCut AI — Deployment Guide (Free Tier Compatible)

**Platform:** PulseCut AI — Intelligent Clipping Studio  
**Target Hosts:** Vercel (Hobby Tier) / Netlify (Free Tier) / GitHub Pages  
**Serverless Functions Cost:** **$0.00** (100% Client-Side Processing)  

---

## 1. Deploying on Vercel (Recommended)

Because all video decoding, reframing, subtitling, and rendering take place inside the user's browser, the application runs entirely within **Vercel's Free Hobby Tier** with zero server compute overhead.

### Step-by-Step Vercel Setup:
1. Connect your GitHub repository: `https://github.com/Code-With-Bitwizards-20/palse-ai`.
2. Configure Project Settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `cd ../.. && npm install`
3. Environment Variables:
   ```env
   NEXT_PUBLIC_APP_URL = https://palse-ai-by-code-with-bitwizards.vercel.app
   NODE_ENV = production
   ```
4. Click **Deploy**. Vercel will build the Next.js frontend and serve it statically across their global Edge Network.

---

## 2. Deploying on Netlify

The repository includes a ready-to-use `netlify.toml` in the root:
```toml
[build]
  command = "npm run build"
  publish = "apps/web/out"

[build.environment]
  NODE_VERSION = "20"
  NODE_ENV = "production"
```
1. Import the repository in the Netlify Dashboard.
2. Netlify auto-detects `netlify.toml`.
3. Click **Deploy Site**.

---

## 3. Local Development

```bash
# 1. Clone repository
git clone https://github.com/Code-With-Bitwizards-20/palse-ai.git
cd palse-ai

# 2. Install dependencies
npm install

# 3. Start local studio
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000/studio
```
No `.env` file or external API keys are required for full studio functionality.
