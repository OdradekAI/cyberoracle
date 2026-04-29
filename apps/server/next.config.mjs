const useStandalone =
  process.env.CI === '1' || process.env.CI === 'true' || process.platform === 'linux';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  output: useStandalone ? 'standalone' : undefined,
  transpilePackages: ['@cyberoracle/core', '@cyberoracle/poster'],
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
};
export default nextConfig;
