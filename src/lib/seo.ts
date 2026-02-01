import type { Metadata } from "next";
import { locales, localeNames, defaultLocale, type Locale } from "@/i18n/config";

const BASE_URL = "https://mcpchallenge.org";

interface SEOConfig {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  image?: string;
  noIndex?: boolean;
}

export function generatePageMetadata({
  title,
  description,
  path,
  locale,
  image = "/og-image.png",
  noIndex = false,
}: SEOConfig): Metadata {
  const url = locale === defaultLocale ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;

  // Generate alternates for all locales
  const alternateLanguages: Record<string, string> = {};
  for (const loc of locales) {
    const langPath = loc === defaultLocale ? path : `/${loc}${path}`;
    alternateLanguages[loc] = `${BASE_URL}${langPath}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "MCP Challenge",
      locale: locale === "en" ? "en_US" : `${locale}_${locale.toUpperCase()}`,
      type: "website",
      images: [
        {
          url: image.startsWith("http") ? image : `${BASE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.startsWith("http") ? image : `${BASE_URL}${image}`],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

// Page-specific SEO data (English defaults)
export const pageSEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "MCP Challenge - Learn & Master the Model Context Protocol",
    description:
      "Interactive platform to learn, build, and compete with the Model Context Protocol (MCP). Free tutorials, playground, and challenges for developers.",
  },
  "/learn": {
    title: "Learn MCP - Tutorials & Documentation",
    description:
      "Step-by-step tutorials to master the Model Context Protocol. From basics to advanced topics - learn how to build MCP servers and tools.",
  },
  "/learn/what-is-mcp": {
    title: "What is MCP? - Introduction to Model Context Protocol",
    description:
      "Learn what the Model Context Protocol (MCP) is, its architecture, and why it matters for AI development. A comprehensive introduction for developers.",
  },
  "/learn/first-mcp-server": {
    title: "Build Your First MCP Server - Tutorial",
    description:
      "Create your first MCP server from scratch with TypeScript. Learn setup, tool creation, and testing in this hands-on tutorial.",
  },
  "/learn/mcp-tools": {
    title: "Creating MCP Tools - Complete Guide",
    description:
      "Learn how to define and implement powerful MCP tools. Covers Zod schemas, error handling, and best practices.",
  },
  "/learn/mcp-resources": {
    title: "MCP Resources & Prompts - Tutorial",
    description:
      "Expose data and templates through MCP resources and prompts. Learn to share data between AI and your applications.",
  },
  "/learn/mcp-transports": {
    title: "MCP Transport Protocols - Stdio, HTTP, WebSocket",
    description:
      "Understand MCP transport protocols: stdio for local tools, HTTP/SSE for web, and WebSocket for real-time communication.",
  },
  "/challenges": {
    title: "MCP Challenges - Test Your Skills",
    description:
      "Interactive coding challenges to test your MCP skills. Build servers, use tools, and play games while learning.",
  },
  "/challenges/chess": {
    title: "Chess Challenge - MCP Game",
    description:
      "Play chess and learn MCP concepts. Challenge the AI or play with friends while building your MCP skills.",
  },
  "/challenges/snake": {
    title: "Snake Challenge - Learn MCP Transports",
    description:
      "Play Snake while learning about MCP transport protocols: stdio, HTTP/SSE, and WebSocket communication.",
  },
  "/challenges/tic-tac-toe": {
    title: "Tic-Tac-Toe Challenge - Minimax AI",
    description:
      "Classic Tic-Tac-Toe with unbeatable minimax AI. Can you force a draw? Learn game theory and MCP.",
  },
  "/playground": {
    title: "MCP Playground - Interactive Code Editor",
    description:
      "Experiment with MCP servers in your browser. No setup required - write, test, and debug MCP code instantly.",
  },
  "/achievements": {
    title: "Achievements - Unlock Badges & Track Progress",
    description:
      "Earn achievements by completing challenges and reaching milestones. Track your MCP learning journey.",
  },
  "/leaderboard": {
    title: "Leaderboard - Top MCP Developers",
    description:
      "See the top MCP developers ranked by points and achievements. Compete and climb the rankings!",
  },
  "/showcase": {
    title: "Showcase - Community MCP Servers",
    description:
      "Explore community-built MCP servers and get inspired. See what others have created with MCP.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description:
      "MCP Challenge privacy policy. Learn how we collect, use, and protect your data.",
  },
};

export function getPageSEO(path: string): { title: string; description: string } {
  return (
    pageSEO[path] || {
      title: "MCP Challenge",
      description: "Learn and master the Model Context Protocol with interactive challenges.",
    }
  );
}
