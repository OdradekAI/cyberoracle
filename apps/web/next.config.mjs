/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@cyberoracle/core',
    '@cyberoracle/poster',
    '@cyberoracle/ui',
    '@cyberoracle/tokens',
  ],
  experimental: {
    serverActions: { bodySizeLimit: '8mb' },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};
export default nextConfig;
