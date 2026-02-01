import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Learn MCP",
  description: "Interactive tutorials to master the Model Context Protocol",
};

const tutorials = [
  {
    id: "what-is-mcp",
    title: "What is MCP?",
    description: "Introduction to the Model Context Protocol and why it matters",
    duration: "5 min",
    difficulty: "beginner",
    topics: ["Overview", "Architecture", "Use Cases"],
  },
  {
    id: "first-mcp-server",
    title: "Your First MCP Server",
    description: "Build a simple MCP server from scratch with TypeScript",
    duration: "15 min",
    difficulty: "beginner",
    topics: ["Setup", "Tools", "Testing"],
  },
  {
    id: "mcp-tools",
    title: "Creating MCP Tools",
    description: "Learn how to define and implement powerful tools",
    duration: "20 min",
    difficulty: "intermediate",
    topics: ["Tool Definition", "Zod Schemas", "Error Handling"],
  },
  {
    id: "mcp-resources",
    title: "MCP Resources & Prompts",
    description: "Expose data and templates through resources and prompts",
    duration: "15 min",
    difficulty: "intermediate",
    topics: ["Resources", "Prompts", "Templates"],
  },
  {
    id: "mcp-transports",
    title: "Transport Protocols",
    description: "Understand stdio, HTTP, and WebSocket transports",
    duration: "10 min",
    difficulty: "advanced",
    topics: ["Stdio", "HTTP/SSE", "WebSocket"],
  },
];

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function LearnPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Learn MCP
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Master the Model Context Protocol with our step-by-step tutorials.
          Start from the basics and work your way up to advanced topics.
        </p>

        <div className="mt-12 space-y-6">
          {tutorials.map((tutorial, index) => (
            <Link key={tutorial.id} href={`/learn/${tutorial.id}`}>
              <Card className="transition-all hover:shadow-lg hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle>{tutorial.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {tutorial.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={difficultyColors[tutorial.difficulty as keyof typeof difficultyColors]}
                      >
                        {tutorial.difficulty}
                      </Badge>
                      <Badge variant="secondary">{tutorial.duration}</Badge>
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
          ))}
        </div>

        {/* Quick Reference */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Quick Reference
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
