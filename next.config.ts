import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack (buggy in 16.1.1)
  experimental: {
    turbo: undefined,
  },
};

export default nextConfig;
