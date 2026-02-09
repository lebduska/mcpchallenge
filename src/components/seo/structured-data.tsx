import Script from "next/script";

interface WebsiteStructuredDataProps {
  url?: string;
  name?: string;
  description?: string;
}

export function WebsiteStructuredData({
  url = "https://mcpchallenge.org",
  name = "MCP Challenge",
  description = "Interactive platform to learn, build, and compete with the Model Context Protocol (MCP). Tutorials, playground, and challenges for developers.",
}: WebsiteStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/challenges?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface OrganizationStructuredDataProps {
  url?: string;
  name?: string;
  logo?: string;
}

export function OrganizationStructuredData({
  url = "https://mcpchallenge.org",
  name = "MCP Challenge",
  logo = "https://mcpchallenge.org/logo.png",
}: OrganizationStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    sameAs: [
      "https://github.com/anthropics/model-context-protocol",
      "https://twitter.com/mcpchallenge",
    ],
  };

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface CourseStructuredDataProps {
  name: string;
  description: string;
  url: string;
  provider?: string;
}

export function CourseStructuredData({
  name,
  description,
  url,
  provider = "MCP Challenge",
}: CourseStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url,
    provider: {
      "@type": "Organization",
      name: provider,
      url: "https://mcpchallenge.org",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT1H",
    },
  };

  return (
    <Script
      id={`course-structured-data-${name.replace(/\s+/g, "-").toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQStructuredDataProps {
  items: FAQItem[];
}

export function FAQStructuredData({ items }: FAQStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface VideoGameStructuredDataProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  genre?: string;
  gamePlatform?: string;
}

export function VideoGameStructuredData({
  name,
  description,
  url,
  image,
  genre = "Educational",
  gamePlatform = "Web Browser",
}: VideoGameStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name,
    description,
    url,
    image,
    genre,
    gamePlatform,
    applicationCategory: "Game",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: {
      "@type": "Organization",
      name: "MCP Challenge",
      url: "https://mcpchallenge.org",
    },
  };

  return (
    <Script
      id={`videogame-structured-data-${name.replace(/\s+/g, "-").toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface SoftwareApplicationStructuredDataProps {
  name?: string;
  description?: string;
  url?: string;
  applicationCategory?: string;
}

export function SoftwareApplicationStructuredData({
  name = "MCP Challenge Playground",
  description = "Interactive playground to build and test MCP servers in your browser",
  url = "https://mcpchallenge.org/playground",
  applicationCategory = "DeveloperApplication",
}: SoftwareApplicationStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory,
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <Script
      id="software-application-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
