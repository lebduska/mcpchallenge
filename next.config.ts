import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Setup Cloudflare dev platform for local development
if (process.env.NODE_ENV === "development") {
  setupDevPlatform();
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "media.licdn.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
