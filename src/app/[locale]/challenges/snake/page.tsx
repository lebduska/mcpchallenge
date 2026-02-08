import type { Metadata } from "next";
import { SnakeClientPage } from "./snake-client";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Snake Challenge",
  description: "Control a snake using MCP tools. Navigate the grid, eat food, and grow without hitting walls or yourself.",
  openGraph: {
    title: "🐍 Snake Challenge - MCP Challenge",
    description: "Control a snake using MCP tools. Navigate the grid, eat food, and grow without hitting walls or yourself.",
    url: `${BASE_URL}/challenges/snake`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/snake.jpg`,
        width: 1200,
        height: 630,
        alt: "Snake Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🐍 Snake Challenge - MCP Challenge",
    description: "Control a snake using MCP tools. Navigate the grid, eat food, and grow!",
    images: [`${BASE_URL}/images/challenges/snake.jpg`],
  },
};

export default function SnakeChallengePage() {
  return <SnakeClientPage />;
}
