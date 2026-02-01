import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/settings",
          "/profile", // User profile requires auth
        ],
      },
    ],
    sitemap: "https://mcpchallenge.org/sitemap.xml",
  };
}
