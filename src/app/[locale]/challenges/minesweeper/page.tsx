import type { Metadata } from "next";
import { MinesweeperClientPage } from "./minesweeper-client";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Minesweeper Challenge",
  description: "Classic Minesweeper! Reveal cells, use number clues to locate mines, and clear the board without hitting one.",
  openGraph: {
    title: "💣 Minesweeper Challenge - MCP Challenge",
    description: "Classic Minesweeper! Reveal cells, use number clues to locate mines, and clear the board without hitting one.",
    url: `${BASE_URL}/challenges/minesweeper`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/minesweeper-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Minesweeper Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "💣 Minesweeper Challenge - MCP Challenge",
    description: "Classic Minesweeper with MCP tools!",
    images: [`${BASE_URL}/images/challenges/minesweeper-cover.jpg`],
  },
};

export default function MinesweeperChallengePage() {
  return <MinesweeperClientPage />;
}
