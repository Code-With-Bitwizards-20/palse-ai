/**
 * Central Application Configuration for PulseCut Local AI.
 * Allows brand name, tagline, URLs, and feature flags to be easily updated across the application.
 */

export const APP_CONFIG = {
  name: 'PulseCut AI — Intelligent Clipping Studio',
  shortName: 'PulseCut AI',
  tagline: 'Intelligent AI Clipping Studio for Creators & Gamers',
  description:
    'Cloud-powered AI video clipping studio. Upload your video, let remote AI workers analyze and clip, then download platform-ready Shorts.',
  url: 'https://palse-ai-by-code-with-bitwizards.vercel.app',
  ogImage: '/brand/og-image.png',
  version: '2.5.0',
  author: 'Code With Bitwizards',
  developerUrl: 'https://code-with-bitwizards.vercel.app/',
  privacyGuarantee: 'Private by design — your videos are encrypted in transit, processed on our secure cloud workers, and deleted after 24 hours.',
  navigation: {
    main: [
      { label: 'Studio Editor', href: '/studio' },
      { label: 'AI Clipping', href: '/ai-clipping' },
      { label: 'AI Captions', href: '/ai-captions' },
      { label: 'Smart Reframe', href: '/smart-reframe' },
      { label: 'Features', href: '/features' },
      { label: 'Platforms', href: '/platforms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'About', href: '/about' },
    ],
  },
  social: {
    github: 'https://github.com/Code-With-Bitwizards-20/palse-ai',
    developer: 'https://code-with-bitwizards.vercel.app/',
    twitter: 'https://x.com/pulsecut_ai',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
