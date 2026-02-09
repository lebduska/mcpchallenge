import type { Metadata } from "next";
import { SokobanClientPage } from "./sokoban-client";
import { VideoGameStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Sokoban Challenge",
  description: "Classic box-pushing puzzle! Navigate the warehouse, push boxes onto goals, and solve increasingly complex levels.",
  openGraph: {
    title: "📦 Sokoban Challenge - MCP Challenge",
    description: "Classic box-pushing puzzle! Navigate the warehouse, push boxes onto goals, and solve increasingly complex levels.",
    url: `${BASE_URL}/challenges/sokoban`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/sokoban-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Sokoban Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "📦 Sokoban Challenge - MCP Challenge",
    description: "Classic box-pushing puzzle game!",
    images: [`${BASE_URL}/images/challenges/sokoban-cover.jpg`],
  },
};

export default function SokobanChallengePage() {
  return (
    <>
      <VideoGameStructuredData
        name="Sokoban Challenge"
        description="Classic box-pushing puzzle! Navigate the warehouse, push boxes onto goals, and solve increasingly complex levels."
        url={`${BASE_URL}/challenges/sokoban`}
        image={`${BASE_URL}/images/challenges/sokoban-cover.jpg`}
        genre="Puzzle"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Challenges", url: `${BASE_URL}/challenges` },
          { name: "Sokoban", url: `${BASE_URL}/challenges/sokoban` },
        ]}
      />
      <SokobanClientPage />
    </>
  );
}
