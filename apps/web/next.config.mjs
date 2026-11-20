/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  transpilePackages: ['@shorts/shared', '@shorts/video-config', '@shorts/platform-presets'],
  // Keep heavy server/native packages out of the client bundle
  serverExternalPackages: ['@prisma/client', 'prisma', 'mediabunny', 'mp4-muxer', 'archiver'],
  images: {
    unoptimized: true,
  },
  experimental: {
    // Tree-shake icon and utility libraries on a per-symbol basis
    optimizePackageImports: [
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'zod',
    ],
  },
};

export default nextConfig;
