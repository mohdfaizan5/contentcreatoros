import type { NextConfig } from "next";
import path from "path";

const ffmpegShimRelativePath = "./src/shims/ffmpeg.ts";
const ffmpegShimAbsolutePath = path.resolve(__dirname, "src/shims/ffmpeg.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
  turbopack: {
    resolveAlias: {
      '@ffmpeg/ffmpeg': ffmpegShimRelativePath,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@ffmpeg/ffmpeg': ffmpegShimAbsolutePath,
    };

    return config;
  },
};

export default nextConfig;
