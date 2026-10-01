import { MetadataRoute } from 'next';
import { PLATFORM_PRESETS } from '@shorts/platform-presets';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pulsecut-ai.vercel.app';

  const staticPages = [
    '',
    '/studio',
    '/video-to-shorts',
    '/ai-captions',
    '/smart-reframe',
    '/features',
    '/platforms',
    '/privacy',
    '/about',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' || route === '/studio' ? 1.0 : 0.8,
  }));

  const platformPages = Object.keys(PLATFORM_PRESETS).map((slug) => ({
    url: `${baseUrl}/platforms/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...platformPages];
}
