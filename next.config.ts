import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "1"
    ? {
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
  images: {
    ...(process.env.STATIC_EXPORT === "1" ? { unoptimized: true } : {}),
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 768, 1024, 1280, 1920],
    imageSizes: [100, 300, 400, 600],
  },
  experimental: {},
};

export default nextConfig;
