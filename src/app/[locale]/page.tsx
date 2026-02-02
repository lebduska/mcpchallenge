"use client";

export const runtime = "edge";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Wrench, Trophy, Heart } from "lucide-react";

function HeroLogo({ className }: { className?: string }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 210 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M105 10 L195 40 L195 100 C195 155 105 195 105 195 C105 195 15 155 15 100 L15 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <text
        x="105"
        y="112"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="52"
        fontWeight="700"
        fill="currentColor"
      >
        MCP
      </text>
    </svg>
  );
}

const featureIcons = {
  learn: BookOpen,
  playground: Wrench,
  challenges: Trophy,
};

export default function Home() {
  const t = useTranslations("home");

  const features = [
    { key: "learn", href: "/learn" },
    { key: "playground", href: "/playground" },
    { key: "challenges", href: "/challenges" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          {t("badge")}
        </Badge>
        <div className="flex items-center justify-center gap-4 mb-2">
          <HeroLogo className="text-zinc-900 dark:text-zinc-50" />
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Challenge
          </h1>
        </div>
        <p className="mt-6 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/learn">{t("startLearning")}</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/playground">{t("tryPlayground")}</Link>
          </Button>
        </div>
      </section>

      {/* What is MCP Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("whatIsMcp.title")}
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            {t("whatIsMcp.description")}
          </p>
          <div className="mt-8 p-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-mono text-sm text-left overflow-x-auto">
            <pre className="text-zinc-800 dark:text-zinc-200">{`// Example MCP Tool
server.tool(
  "weather.get",
  "Get current weather for a city",
  { city: z.string() },
  async ({ city }) => {
    const data = await fetchWeather(city);
    return { temperature: data.temp, conditions: data.weather };
  }
);`}</pre>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-zinc-900 dark:text-zinc-50 mb-12">
          {t("journey.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => {
            const Icon = featureIcons[feature.key as keyof typeof featureIcons];
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className="h-full transition-all hover:shadow-lg hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className="h-10 w-10 text-zinc-700 dark:text-zinc-300" />
                      <Badge>{t(`journey.features.${feature.key}.badge`)}</Badge>
                    </div>
                    <CardTitle className="mt-4">{t(`journey.features.${feature.key}.title`)}</CardTitle>
                    <CardDescription>{t(`journey.features.${feature.key}.description`)}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">10+</div>
            <div className="text-zinc-600 dark:text-zinc-400">{t("stats.challenges")}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">5</div>
            <div className="text-zinc-600 dark:text-zinc-400">{t("stats.tutorials")}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">∞</div>
            <div className="text-zinc-600 dark:text-zinc-400">{t("stats.possibilities")}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">0</div>
            <div className="text-zinc-600 dark:text-zinc-400">{t("stats.cost")}</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
            {t("footer.builtWith")} <Heart className="h-4 w-4 text-red-500 fill-red-500" /> {t("footer.forCommunity")}
          </p>
          <div className="flex gap-4">
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              MCP Docs
            </a>
            <a
              href="https://github.com/anthropics/anthropic-cookbook/tree/main/misc/model_context_protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
