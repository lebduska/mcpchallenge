import type { Metadata } from "next";
import { GorillasClientPage } from "./gorillas-client";
import { VideoGameStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Gorillas Challenge",
  description: "Classic artillery game! Calculate trajectory angles and velocities to hit your opponent with bananas.",
  openGraph: {
    title: "🍌 Gorillas Challenge - MCP Challenge",
    description: "Classic artillery game! Calculate trajectory angles and velocities to hit your opponent with bananas.",
    url: `${BASE_URL}/challenges/gorillas`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/gorillas-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Gorillas Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🍌 Gorillas Challenge - MCP Challenge",
    description: "Classic artillery game with bananas!",
    images: [`${BASE_URL}/images/challenges/gorillas-cover.jpg`],
  },
};

export default function GorillasChallengePage() {
  return (
    <>
      <VideoGameStructuredData
        name="Gorillas Challenge"
        description="Classic artillery game! Calculate trajectory angles and velocities to hit your opponent with bananas."
        url={`${BASE_URL}/challenges/gorillas`}
        image={`${BASE_URL}/images/challenges/gorillas-cover.jpg`}
        genre="Action"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Challenges", url: `${BASE_URL}/challenges` },
          { name: "Gorillas", url: `${BASE_URL}/challenges/gorillas` },
        ]}
      />
      <GorillasClientPage />
    </>
  );
}
