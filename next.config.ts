import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSR mode for Cloudflare Pages (removed: output: "export")
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "media.licdn.com" },
    ],
  },
};

export default nextConfig;
