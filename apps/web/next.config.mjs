/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  reactStrictMode: true,
  transpilePackages: ['@shorts/shared', '@shorts/video-config', '@shorts/platform-presets'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
