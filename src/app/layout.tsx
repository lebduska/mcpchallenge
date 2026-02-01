import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth/auth-provider";
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
  title: {
    default: "MCP Challenge - Learn & Master the Model Context Protocol",
    template: "%s | MCP Challenge",
  },
  description:
    "Interactive platform to learn, build, and compete with the Model Context Protocol (MCP). Tutorials, playground, and challenges for developers.",
  keywords: ["MCP", "Model Context Protocol", "AI", "Anthropic", "Claude", "Tools", "LLM"],
  authors: [{ name: "MCP Challenge" }],
  openGraph: {
    title: "MCP Challenge",
    description: "Master the Model Context Protocol with interactive tutorials and challenges",
    url: "https://mcpchallenge.org",
    siteName: "MCP Challenge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Challenge",
    description: "Master the Model Context Protocol with interactive tutorials and challenges",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-zinc-950`}
      >
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
