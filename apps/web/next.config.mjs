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
};

export default nextConfig;
