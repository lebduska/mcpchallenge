import type { Metadata } from "next";
import { ChessClientPage } from "./chess-client";
import { VideoGameStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Chess Challenge",
  description: "Play chess against an engine using MCP tools. Make moves, analyze positions, and test your AI's strategic thinking.",
  openGraph: {
    title: "♟️ Chess Challenge - MCP Challenge",
    description: "Play chess against an engine using MCP tools. Make moves, analyze positions, and test your AI's strategic thinking.",
    url: `${BASE_URL}/challenges/chess`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/chess-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Chess Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "♟️ Chess Challenge - MCP Challenge",
    description: "Play chess against an engine using MCP tools!",
    images: [`${BASE_URL}/images/challenges/chess-cover.jpg`],
  },
};

export default function ChessChallengePage() {
  return (
    <>
      <VideoGameStructuredData
        name="Chess Challenge"
        description="Play chess against an engine using MCP tools. Make moves, analyze positions, and test your AI's strategic thinking."
        url={`${BASE_URL}/challenges/chess`}
        image={`${BASE_URL}/images/challenges/chess-cover.jpg`}
        genre="Strategy"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Challenges", url: `${BASE_URL}/challenges` },
          { name: "Chess", url: `${BASE_URL}/challenges/chess` },
        ]}
      />
      <ChessClientPage />
    </>
  );
}
