import type { Metadata } from "next";
import { TicTacToeClientPage } from "./tictactoe-client";
import { VideoGameStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Tic-Tac-Toe Challenge",
  description: "Classic Tic-Tac-Toe! Perfect for learning MCP basics. Make moves, track game state, and play against an AI opponent.",
  openGraph: {
    title: "⭕ Tic-Tac-Toe Challenge - MCP Challenge",
    description: "Classic Tic-Tac-Toe! Perfect for learning MCP basics. Make moves, track game state, and play against an AI opponent.",
    url: `${BASE_URL}/challenges/tic-tac-toe`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/tictactoe-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Tic-Tac-Toe Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "⭕ Tic-Tac-Toe Challenge - MCP Challenge",
    description: "Classic Tic-Tac-Toe with MCP!",
    images: [`${BASE_URL}/images/challenges/tictactoe-cover.jpg`],
  },
};

export default function TicTacToeChallengePage() {
  return (
    <>
      <VideoGameStructuredData
        name="Tic-Tac-Toe Challenge"
        description="Classic Tic-Tac-Toe! Perfect for learning MCP basics. Make moves, track game state, and play against an AI opponent."
        url={`${BASE_URL}/challenges/tic-tac-toe`}
        image={`${BASE_URL}/images/challenges/tictactoe-cover.jpg`}
        genre="Strategy"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Challenges", url: `${BASE_URL}/challenges` },
          { name: "Tic-Tac-Toe", url: `${BASE_URL}/challenges/tic-tac-toe` },
        ]}
      />
      <TicTacToeClientPage />
    </>
  );
}
