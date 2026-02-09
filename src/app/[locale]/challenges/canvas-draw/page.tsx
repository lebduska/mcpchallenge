import type { Metadata } from "next";
import { CanvasClientPage } from "./canvas-client";
import { VideoGameStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Canvas Drawing Challenge",
  description: "Create pixel art using MCP tools. Control colors, draw shapes, and build creative images programmatically.",
  openGraph: {
    title: "🎨 Canvas Drawing Challenge - MCP Challenge",
    description: "Create pixel art using MCP tools. Control colors, draw shapes, and build creative images programmatically.",
    url: `${BASE_URL}/challenges/canvas-draw`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/canvas-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Canvas Drawing Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🎨 Canvas Drawing Challenge - MCP Challenge",
    description: "Create pixel art using MCP tools. Draw shapes and build creative images!",
    images: [`${BASE_URL}/images/challenges/canvas-cover.jpg`],
  },
};

export default function CanvasDrawChallengePage() {
  return (
    <>
      <VideoGameStructuredData
        name="Canvas Drawing Challenge"
        description="Create pixel art using MCP tools. Control colors, draw shapes, and build creative images programmatically."
        url={`${BASE_URL}/challenges/canvas-draw`}
        image={`${BASE_URL}/images/challenges/canvas-cover.jpg`}
        genre="Creative"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Challenges", url: `${BASE_URL}/challenges` },
          { name: "Canvas Draw", url: `${BASE_URL}/challenges/canvas-draw` },
        ]}
      />
      <CanvasClientPage />
    </>
  );
}
