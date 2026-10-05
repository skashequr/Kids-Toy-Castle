import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.luxen.com.bd" },
      { protocol: "https", hostname: "kazi-blubird.sfo2.cdn.digitaloceanspaces.com" },
    ],
    qualities: [50, 75, 90],
  },
  experimental: {
    // Loading every route at startup costs a large amount of heap in this
    // admin-heavy app. Routes still load normally when they are requested.
    preloadEntriesOnStart: false,
    webpackMemoryOptimizations: true,
    cpus: 2,
  },
  onDemandEntries: {
    maxInactiveAge: 20 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
