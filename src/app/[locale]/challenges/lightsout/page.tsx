import type { Metadata } from "next";
import { LightsOutClientPage } from "./lightsout-client";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Lights Out Challenge",
  description: "Classic puzzle game! Toggle lights in a cross pattern to turn them all off. Uses XOR logic and linear algebra.",
  openGraph: {
    title: "💡 Lights Out Challenge - MCP Challenge",
    description: "Classic puzzle game! Toggle lights in a cross pattern to turn them all off. Uses XOR logic and linear algebra.",
    url: `${BASE_URL}/challenges/lightsout`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/lightsout-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Lights Out Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "💡 Lights Out Challenge - MCP Challenge",
    description: "Classic puzzle game with XOR logic!",
    images: [`${BASE_URL}/images/challenges/lightsout-cover.jpg`],
  },
};

export default function LightsOutChallengePage() {
  return <LightsOutClientPage />;
}
