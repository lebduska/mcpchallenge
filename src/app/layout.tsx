import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAnalytics, CookieConsent } from "@/components/analytics";
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mcpchallenge.org"),
  title: {
    default: "MCP Challenge - Learn & Master the Model Context Protocol",
    template: "%s | MCP Challenge",
  },
  description:
    "Interactive platform to learn, build, and compete with the Model Context Protocol (MCP). Tutorials, playground, and challenges for developers.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "AI",
    "Anthropic",
    "Claude",
    "Tools",
    "LLM",
    "AI Development",
    "Machine Learning",
    "Developer Tools",
    "API Integration",
    "Tutorial",
    "Learn MCP",
    "MCP Server",
    "AI Assistant",
  ],
  authors: [{ name: "MCP Challenge" }],
  creator: "MCP Challenge",
  publisher: "MCP Challenge",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "MCP Challenge - Master the Model Context Protocol",
    description:
      "Learn, build, and compete with interactive MCP challenges. Free tutorials, playground, and achievements for developers.",
    url: "https://mcpchallenge.org",
    siteName: "MCP Challenge",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Challenge - Master the Model Context Protocol",
    description:
      "Learn, build, and compete with interactive MCP challenges. Free tutorials, playground, and achievements.",
    creator: "@mcpchallenge",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://mcpchallenge.org",
    languages: {
      "en-US": "https://mcpchallenge.org",
      "cs-CZ": "https://mcpchallenge.org/cs",
      "de-DE": "https://mcpchallenge.org/de",
      "es-ES": "https://mcpchallenge.org/es",
      "fr-FR": "https://mcpchallenge.org/fr",
      "ja-JP": "https://mcpchallenge.org/ja",
      "zh-CN": "https://mcpchallenge.org/zh",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-zinc-950`}
      >
        <WebsiteStructuredData />
        <OrganizationStructuredData />
        <GoogleAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
