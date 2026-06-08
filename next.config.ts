import type { NextConfig } from "next";
import { createMDX } from 'fumadocs-mdx/next';

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: '25mb',
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        // pathname: '/account123/**',
      },
    ],
  },
};

const withMDX = createMDX({
  // customize the config file path
  // configPath: "source.config.ts"
});
export default withMDX(nextConfig);