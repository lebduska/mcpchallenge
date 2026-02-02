import { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/config";

const BASE_URL = "https://mcpchallenge.org";

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/learn", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/learn/what-is-mcp", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/learn/first-mcp-server", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/learn/mcp-tools", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/learn/mcp-resources", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/learn/mcp-transports", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/challenges", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/challenges/chess", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/challenges/tic-tac-toe", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/challenges/snake", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/challenges/hello-world", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/challenges/calculator", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/challenges/file-reader", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/challenges/weather-api", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/challenges/multi-tool", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/challenges/data-pipeline", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/playground", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/achievements", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/leaderboard", priority: 0.6, changeFrequency: "daily" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Generate entries for each locale and page
  for (const page of staticPages) {
    // Default locale (English) - canonical URL without locale prefix
    entries.push({
      url: `${BASE_URL}${page.path || "/"}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((locale) => [
            locale,
            locale === defaultLocale
              ? `${BASE_URL}${page.path || "/"}`
              : `${BASE_URL}/${locale}${page.path}`,
          ])
        ),
      },
    });

    // Other locales
    for (const locale of locales) {
      if (locale === defaultLocale) continue;

      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority * 0.9, // Slightly lower priority for non-default locales
      });
    }
  }

  return entries;
}
