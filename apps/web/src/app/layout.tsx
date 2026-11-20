import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { APP_CONFIG } from '@/config/app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url || 'https://palse-ai-by-code-with-bitwizards.vercel.app'),
  title: 'PulseCut AI — Cloud-Powered Video to Shorts Studio',
  description:
    'AI-powered video clipping studio. Upload your video, let our cloud workers analyze and create platform-ready Shorts with smart reframing, captions, and professional editing.',
  keywords: [
    'video to shorts',
    'AI video editor',
    'youtube shorts maker',
    'tiktok video editor',
    'instagram reels editor',
    'AI captions',
    'cloud AI video editor',
    'video shorts maker',
    '60 fps short video',
  ],
  authors: [{ name: APP_CONFIG.author }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', type: 'image/png', sizes: '192x192', url: '/icon-192.png' },
      { rel: 'icon', type: 'image/png', sizes: '512x512', url: '/icon-512.png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'PulseCut AI — Cloud-Powered Video to Shorts Studio',
    description:
      'AI-powered video clipping studio. Upload your video, let our cloud workers analyze and create platform-ready Shorts with smart reframing, captions, and professional editing.',
    type: 'website',
    locale: 'en_US',
    siteName: 'PulseCut AI',
    url: APP_CONFIG.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseCut AI — Cloud-Powered Video to Shorts Studio',
    description:
      'AI-powered video clipping studio. Upload your video, let our cloud workers analyze and create platform-ready Shorts with smart reframing, captions, and professional editing.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: APP_CONFIG.name,
        url: APP_CONFIG.url,
      },
      {
        '@type': 'SoftwareApplication',
        name: APP_CONFIG.name,
        operatingSystem: 'Web Browser',
        applicationCategory: 'MultimediaApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Canonical is set per-page via next metadata */}
      </head>
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white font-sans">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
