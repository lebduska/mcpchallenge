import type { Metadata } from "next";
import { PathfindingClientPage } from "./pathfinding-client";
import { VideoGameStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Pathfinding Playground",
  description: "Interactive pathfinding visualizer. Build grids with walls and weights, then watch BFS, Dijkstra, and A* find the optimal route in real time.",
  openGraph: {
    title: "🧭 Pathfinding Playground - MCP Challenge",
    description: "Interactive pathfinding visualizer. Build grids with walls and weights, then watch BFS, Dijkstra, and A* find the optimal route in real time.",
    url: `${BASE_URL}/challenges/pathfinding`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/pathfinding-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Pathfinding Playground",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🧭 Pathfinding Playground - MCP Challenge",
    description: "Build grids and visualize pathfinding algorithms!",
    images: [`${BASE_URL}/images/challenges/pathfinding-cover.jpg`],
  },
};

export default function PathfindingChallengePage() {
  return (
    <>
      <VideoGameStructuredData
        name="Pathfinding Playground"
        description="Interactive pathfinding visualizer. Build grids with walls and weights, then watch BFS, Dijkstra, and A* find the optimal route in real time."
        url={`${BASE_URL}/challenges/pathfinding`}
        image={`${BASE_URL}/images/challenges/pathfinding-cover.jpg`}
        genre="Educational"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Challenges", url: `${BASE_URL}/challenges` },
          { name: "Pathfinding", url: `${BASE_URL}/challenges/pathfinding` },
        ]}
      />
      <PathfindingClientPage />
    </>
  );
}
