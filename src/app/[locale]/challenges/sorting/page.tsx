import type { Metadata } from "next";
import { SortingClientPage } from "./sorting-client";
import { VideoGameStructuredData, BreadcrumbStructuredData } from "@/components/seo";

export const runtime = "edge";

const BASE_URL = "https://mcpchallenge.org";

export const metadata: Metadata = {
  title: "Sorting Algorithm Challenge",
  description: "Learn sorting algorithms by implementing compare and swap operations. Can your AI discover an O(n log n) algorithm?",
  openGraph: {
    title: "Sorting Algorithm Challenge - MCP Challenge",
    description: "Learn sorting algorithms by implementing compare and swap operations. Can your AI discover an O(n log n) algorithm?",
    url: `${BASE_URL}/challenges/sorting`,
    siteName: "MCP Challenge",
    images: [
      {
        url: `${BASE_URL}/images/challenges/sorting-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Sorting Algorithm Challenge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sorting Algorithm Challenge - MCP Challenge",
    description: "Teach AI to sort arrays with minimum comparisons!",
    images: [`${BASE_URL}/images/challenges/sorting-cover.jpg`],
  },
};

export default function SortingChallengePage() {
  return (
    <>
      <VideoGameStructuredData
        name="Sorting Algorithm Challenge"
        description="Learn sorting algorithms by implementing compare and swap operations. Can your AI discover an O(n log n) algorithm?"
        url={`${BASE_URL}/challenges/sorting`}
        image={`${BASE_URL}/images/challenges/sorting-cover.jpg`}
        genre="Educational"
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Challenges", url: `${BASE_URL}/challenges` },
          { name: "Sorting", url: `${BASE_URL}/challenges/sorting` },
        ]}
      />
      <SortingClientPage />
    </>
  );
}
