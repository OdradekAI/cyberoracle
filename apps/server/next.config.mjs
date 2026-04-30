const useStandalone =
  process.env.CI === '1' || process.env.CI === 'true' || process.platform === 'linux';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  output: useStandalone ? 'standalone' : undefined,
  transpilePackages: ['@cyberoracle/core', '@cyberoracle/poster'],
  serverExternalPackages: ['@resvg/resvg-js', '@resvg/resvg-js-win32-x64-msvc', 'sharp'],
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          '@resvg/resvg-js': 'commonjs @resvg/resvg-js',
        });
      }
    }
    return config;
  },
};
export default nextConfig;
