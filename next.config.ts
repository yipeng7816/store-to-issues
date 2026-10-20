import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Session cookies + Cache Components caused sticky 401 on /api/reviews
  // while /api/auth/me still looked logged-in. Keep caching off for auth apps.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
