import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages trailing slashes
  trailingSlash: true,
};

export default nextConfig;
