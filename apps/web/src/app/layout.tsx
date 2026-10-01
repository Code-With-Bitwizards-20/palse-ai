import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { APP_CONFIG } from '@/config/app';

export const metadata: Metadata = {
  title: 'PulseCut Local AI — Private Long Video to Shorts Studio',
  description:
    '100% in-browser, privacy-first AI video clipping studio. Converts long videos into 60 FPS platform-ready Shorts with zero server uploads and zero API keys.',
  keywords: [
    'video to shorts',
    'AI video editor',
    'youtube shorts maker',
    'tiktok video editor',
    'instagram reels editor',
    'AI captions',
    'local AI video editor',
    'private browser video editor',
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
    title: 'PulseCut Local AI — Private Long Video to Shorts Studio',
    description:
      'Turn long videos into scroll-stopping 60 FPS Shorts directly in your browser. 100% local processing, zero cloud uploads.',
    type: 'website',
    locale: 'en_US',
    siteName: 'PulseCut Local AI',
    url: APP_CONFIG.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseCut Local AI — Private Long Video to Shorts Studio',
    description:
      'Turn long videos into scroll-stopping 60 FPS Shorts directly in your browser. 100% local processing, zero cloud uploads.',
  },
};

export const viewport = {
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
