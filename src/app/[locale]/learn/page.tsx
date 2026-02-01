"use client";

export const runtime = "edge";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tutorialIds = [
  { id: "what-is-mcp", key: "whatIsMcp", duration: "5", topics: ["Overview", "Architecture", "Use Cases"] },
  { id: "first-mcp-server", key: "firstServer", duration: "15", topics: ["Setup", "Tools", "Testing"] },
  { id: "mcp-tools", key: "mcpTools", duration: "20", topics: ["Tool Definition", "Zod Schemas", "Error Handling"] },
  { id: "mcp-resources", key: "mcpResources", duration: "15", topics: ["Resources", "Prompts", "Templates"] },
  { id: "mcp-transports", key: "mcpTransports", duration: "10", topics: ["Stdio", "HTTP/SSE", "WebSocket"] },
];

const difficulties: Record<string, string> = {
  whatIsMcp: "beginner",
  firstServer: "beginner",
  mcpTools: "intermediate",
  mcpResources: "intermediate",
  mcpTransports: "advanced",
};

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function LearnPage() {
  const t = useTranslations("learn");
  const tc = useTranslations("common");

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>

        <div className="mt-12 grid gap-6">
          {tutorialIds.map((tutorial, index) => {
            const difficulty = difficulties[tutorial.key];
            return (
              <Link key={tutorial.id} href={`/learn/${tutorial.id}`} className="block">
                <Card className="transition-all hover:shadow-lg hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle>{t(`tutorials.${tutorial.key}.title`)}</CardTitle>
                          <CardDescription className="mt-1">
                            {t(`tutorials.${tutorial.key}.description`)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={difficultyColors[difficulty as keyof typeof difficultyColors]}
                        >
                          {t(`difficulty.${difficulty}`)}
                        </Badge>
                        <Badge variant="secondary">{tutorial.duration} {tc("minutes")}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tutorial.topics.map((topic) => (
                        <Badge key={topic} variant="outline">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Reference */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("quickReference")}
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MCP SDK</CardTitle>
                <CardDescription>Official TypeScript SDK documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://github.com/modelcontextprotocol/typescript-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  github.com/modelcontextprotocol/typescript-sdk
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MCP Specification</CardTitle>
                <CardDescription>Full protocol specification</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://spec.modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  spec.modelcontextprotocol.io
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
