import type { Metadata } from "next";
import { FractalsClientPage } from "./fractals-client";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "L-System Fractals Challenge",
  description: "Create beautiful fractals using L-System rules. Define axioms, production rules, and render stunning mathematical art.",
  openGraph: {
    title: "✨ L-System Fractals Challenge - MCP Challenge",
    description: "Create beautiful fractals using L-System rules. Define axioms, production rules, and render stunning mathematical art.",
    url: `${BASE_URL}/challenges/fractals`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/fractals-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "L-System Fractals Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "✨ L-System Fractals Challenge - MCP Challenge",
    description: "Create beautiful fractals using L-System rules!",
    images: [`${BASE_URL}/images/challenges/fractals-cover.jpg`],
  },
};

export default function FractalsChallengePage() {
  return <FractalsClientPage />;
}
