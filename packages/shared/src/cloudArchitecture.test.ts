/**
 * Cloud Architecture Integration Tests
 *
 * Verifies that:
 * 1. No local video rendering paths exist in browser-facing code
 * 2. All required API routes exist
 * 3. SSRF guard blocks private IPs
 * 4. Cloud architecture env vars are documented
 * 5. No local/browser marketing claims remain in key pages
 * 6. Dockerfile.worker has health checks
 * 7. Worker entry point compiles to server.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Robust root finder starting from current process or file
function findRepoRoot(): string {
  let cur = process.cwd();
  while (!fs.existsSync(path.join(cur, 'apps/web')) || !fs.existsSync(path.join(cur, 'services/media-worker'))) {
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return cur;
}

const ROOT = findRepoRoot();
const WEB_SRC = path.join(ROOT, 'apps/web/src');

function readText(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function scanDir(dir: string, ext: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full, ext));
    else if (entry.name.endsWith(ext)) results.push(full);
  }
  return results;
}

describe('PulseCut AI — Cloud-Powered Architecture Verification', () => {
  it('TEST 1: No renderShortToMp4 or local WebCodecs rendering in app/ components', () => {
    const forbidden = [
      'renderShortToMp4',
      'renderFrameToCanvas',
      'ffmpeg.wasm',
      '@ffmpeg/ffmpeg',
    ];

    const appDir = path.join(WEB_SRC, 'app');
    const tsFiles = scanDir(appDir, '.tsx').concat(scanDir(appDir, '.ts'));

    const violations: string[] = [];
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const keyword of forbidden) {
        if (content.includes(keyword)) {
          violations.push(`${path.relative(ROOT, file)}: contains "${keyword}"`);
        }
      }
    }

    assert.deepEqual(violations, [], `Local rendering detected:\n${violations.join('\n')}`);
  });

  it('TEST 2: No browser-side transcribeVideoAudio calls in app/ pages', () => {
    const appDir = path.join(WEB_SRC, 'app');
    const tsFiles = scanDir(appDir, '.tsx').concat(scanDir(appDir, '.ts'));

    const violations: string[] = [];
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('transcribeVideoAudio(') || content.includes("from '@/lib/speechEngine'")) {
        violations.push(path.relative(ROOT, file));
      }
    }

    assert.deepEqual(violations, [], `Browser Whisper inference detected:\n${violations.join('\n')}`);
  });

  it('TEST 3: All required cloud API routes exist', () => {
    const required = [
      'apps/web/src/app/api/health/route.ts',
      'apps/web/src/app/api/upload/route.ts',
      'apps/web/src/app/api/upload/url/route.ts',
      'apps/web/src/app/api/upload/init/route.ts',
      'apps/web/src/app/api/upload/complete/route.ts',
      'apps/web/src/app/api/jobs/route.ts',
      'apps/web/src/app/api/jobs/[id]/route.ts',
      'apps/web/src/app/api/jobs/[id]/events/route.ts',
      'apps/web/src/app/api/jobs/[id]/cancel/route.ts',
      'apps/web/src/app/api/projects/route.ts',
      'apps/web/src/app/api/projects/[id]/route.ts',
      'apps/web/src/app/api/clips/route.ts',
      'apps/web/src/app/api/clips/[id]/route.ts',
      'apps/web/src/app/api/clips/[id]/export/route.ts',
      'apps/web/src/app/api/exports/[id]/route.ts',
      'apps/web/src/app/api/worker/health/route.ts',
      'apps/web/src/app/api/downloads/[filename]/route.ts',
      'apps/web/src/app/api/url-import/route.ts',
    ];

    for (const route of required) {
      assert.ok(fileExists(route), `Missing required API route: ${route}`);
    }
  });

  it('TEST 4: ssrfGuard blocks private IPs and non-HTTPS URLs', () => {
    const ssrfPath = path.join(WEB_SRC, 'lib/ssrfGuard.ts');
    assert.ok(fs.existsSync(ssrfPath), 'ssrfGuard.ts must exist');

    const src = fs.readFileSync(ssrfPath, 'utf-8');
    const privatePatterns = ['10\\.', '192\\.168', '172\\.(1[6-9]|2\\d|3[01])', '127\\.', 'localhost'];
    for (const pattern of privatePatterns) {
      assert.ok(src.includes(pattern.replace('\\\\', '\\')), `ssrfGuard should block pattern: ${pattern}`);
    }
    assert.ok(src.includes("'https:'"), 'ssrfGuard should enforce HTTPS');
  });

  it('TEST 5: Cloud architecture env vars documented in .env.example', () => {
    const envExample = readText('.env.example');
    const required = [
      'MEDIA_WORKER_URL',
      'WORKER_SECRET',
      'STORAGE_DRIVER',
      'DATABASE_URL',
      'REDIS_URL',
      'MAX_UPLOAD_SIZE_MB',
      'OUTPUT_RETENTION_HOURS',
    ];

    for (const key of required) {
      assert.ok(envExample.includes(key), `${key} must be documented in .env.example`);
    }
  });

  it('TEST 6: No contradictory local-only marketing claims in key pages', () => {
    const forbidden = [
      '100% local processing',
      '100% in-browser',
      'No video upload',
      'never touches a server',
      'never leaves your device',
      'PulseCut Local AI',
    ];

    const keyFiles = [
      'apps/web/src/app/layout.tsx',
      'apps/web/src/app/page.tsx',
      'apps/web/src/app/video-to-shorts/page.tsx',
      'apps/web/src/app/about/page.tsx',
      'apps/web/src/app/privacy/page.tsx',
      'apps/web/src/app/studio/page.tsx',
    ];

    const violations: string[] = [];
    for (const relFile of keyFiles) {
      if (!fileExists(relFile)) continue;
      const content = readText(relFile).toLowerCase();
      for (const claim of forbidden) {
        if (content.includes(claim.toLowerCase())) {
          violations.push(`${relFile}: contains "${claim}"`);
        }
      }
    }

    assert.deepEqual(violations, [], `Local-only marketing claims found:\n${violations.join('\n')}`);
  });

  it('TEST 7: Dockerfile.worker exists and has HEALTHCHECK', () => {
    assert.ok(fileExists('Dockerfile.worker'), 'Dockerfile.worker must exist');
    const content = readText('Dockerfile.worker');
    assert.ok(content.includes('HEALTHCHECK'), 'Dockerfile.worker must include HEALTHCHECK directive');
  });

  it('TEST 8: Media worker server entry point is compiled', () => {
    assert.ok(
      fileExists('services/media-worker/dist/server.js'),
      'services/media-worker/dist/server.js must exist'
    );
  });

  it('TEST 9: Prisma schema contains all required entities', () => {
    assert.ok(fileExists('prisma/schema.prisma'), 'prisma/schema.prisma must exist');
    const schema = readText('prisma/schema.prisma');
    const requiredModels = [
      'model User',
      'model Project',
      'model SourceVideo',
      'model ProcessingJob',
      'model JobEvent',
      'model Clip',
      'model TranscriptWord',
      'model Render',
      'model PlatformMetadata',
    ];
    for (const model of requiredModels) {
      assert.ok(schema.includes(model), `Prisma schema must declare: ${model}`);
    }
  });

  it('TEST 10: Source adapters exist and YouTube adapter respects platform terms', () => {
    const adapterPath = path.join(WEB_SRC, 'lib/sourceAdapters.ts');
    assert.ok(fs.existsSync(adapterPath), 'sourceAdapters.ts must exist');
    const content = fs.readFileSync(adapterPath, 'utf-8');
    assert.ok(content.includes('YouTubeSourceAdapter'), 'YouTubeSourceAdapter must be defined');
    assert.ok(content.includes('DirectMediaUrlAdapter'), 'DirectMediaUrlAdapter must be defined');
    assert.ok(content.includes('YOUTUBE_DIRECT_STREAM_RESTRICTED'), 'Must define YOUTUBE_DIRECT_STREAM_RESTRICTED code');
    assert.ok(content.includes('directUploadRecommended'), 'Must recommend direct upload for restricted sources');
  });

  it('TEST 11: Zero AudioContext, decodeAudioData, or AudioBuffer in apps/web/src/app/studio/page.tsx', () => {
    const studioPath = path.join(WEB_SRC, 'app/studio/page.tsx');
    assert.ok(fs.existsSync(studioPath), 'studio/page.tsx must exist');
    const content = fs.readFileSync(studioPath, 'utf-8');

    const forbiddenAudioApis = [
      'new AudioContext',
      'new (window.AudioContext',
      'decodeAudioData',
      'AudioBuffer',
      'detectCandidateHighlights(',
      'generateGamingHighlights(',
    ];

    for (const api of forbiddenAudioApis) {
      assert.ok(!content.includes(api), `studio/page.tsx must not contain client audio processing: "${api}"`);
    }
  });

  it('TEST 12: YouTube Timestamp Studio component is implemented for official embed preview', () => {
    const componentPath = path.join(WEB_SRC, 'components/YouTubeTimestampStudio.tsx');
    assert.ok(fs.existsSync(componentPath), 'YouTubeTimestampStudio.tsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('youtube-nocookie.com/embed'), 'Must use official privacy-enhanced YouTube embed');
    assert.ok(content.includes('getChaptersText'), 'Must support chapters text export');
    assert.ok(content.includes('downloadJson'), 'Must support JSON EDL export');
    assert.ok(content.includes('downloadCsv'), 'Must support CSV export');
  });

  it('TEST 13: Media worker audioAnalyzer implements real FFmpeg silencedetect', () => {
    const analyzerPath = path.join(ROOT, 'services/media-worker/src/audioAnalyzer.ts');
    assert.ok(fs.existsSync(analyzerPath), 'audioAnalyzer.ts must exist');
    const content = fs.readFileSync(analyzerPath, 'utf-8');
    assert.ok(content.includes('silencedetect=noise=-28dB:d=0.4'), 'Must configure silencedetect filter');
    assert.ok(content.includes('readInt16LE'), 'Must read 16-bit PCM WAV samples');
  });

  it('TEST 14: PostgreSQL schema file exists for cloud database deployment', () => {
    const pgSchemaPath = path.join(ROOT, 'prisma/schema.postgresql.prisma');
    assert.ok(fs.existsSync(pgSchemaPath), 'prisma/schema.postgresql.prisma must exist');
    const content = fs.readFileSync(pgSchemaPath, 'utf-8');
    assert.ok(content.includes('provider = "postgresql"'), 'Must declare provider = postgresql');
  });
});
