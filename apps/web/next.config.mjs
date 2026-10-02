/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'production' && !process.env.VERCEL ? { output: 'export' } : {}),
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
  // Aggressive bundle splitting — keep each async chunk small
  webpack(config, { isServer }) {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        maxInitialRequests: 25,
        minSize: 20_000,
      };
    }
    return config;
  },
};

export default nextConfig;
