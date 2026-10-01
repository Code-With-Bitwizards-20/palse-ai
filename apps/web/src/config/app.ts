/**
 * Central Application Configuration for PulseCut Local AI.
 * Allows brand name, tagline, URLs, and feature flags to be easily updated across the application.
 */

export const APP_CONFIG = {
  name: 'PulseCut Local AI',
  shortName: 'PulseCut',
  tagline: 'Private Long Video to Shorts Studio',
  description:
    '100% in-browser, privacy-first AI video clipping studio. Converts long videos into 60 FPS platform-ready Shorts with zero server uploads and zero API keys.',
  url: 'https://pulsecut-ai.vercel.app',
  ogImage: '/brand/og-image.png',
  version: '2.0.0',
  author: 'PulseCut Engineering',
  privacyGuarantee: 'Private by design — your videos are processed locally in your browser and are not uploaded to our servers.',
  navigation: {
    main: [
      { label: 'Studio Editor', href: '/studio' },
      { label: 'Video to Shorts', href: '/video-to-shorts' },
      { label: 'AI Captions', href: '/ai-captions' },
      { label: 'Smart Reframe', href: '/smart-reframe' },
      { label: 'Features', href: '/features' },
      { label: 'Platforms', href: '/platforms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'About', href: '/about' },
    ],
  },
  social: {
    github: 'https://github.com/pulsecut/pulsecut',
    twitter: 'https://x.com/pulsecut_ai',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
