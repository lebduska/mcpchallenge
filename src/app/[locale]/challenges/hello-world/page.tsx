"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, CheckCircle2, Copy } from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";
import { useState } from "react";

const helloWorldCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "hello-world-server",
  version: "1.0.0",
});

// Simple greeting tool
server.tool(
  "greet",
  "Greet a user by name",
  {
    name: z.string().describe("The name to greet"),
  },
  async ({ name }) => ({
    content: [{
      type: "text",
      text: \`Hello, \${name}! Welcome to MCP! 👋\`,
    }],
  })
);

// Tool with no parameters
server.tool(
  "hello",
  "Say hello to the world",
  {},
  async () => ({
    content: [{
      type: "text",
      text: "Hello, World! 🌍",
    }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

const steps = [
  {
    title: "Create project",
    code: `mkdir hello-mcp && cd hello-mcp
npm init -y
npm install @modelcontextprotocol/sdk zod`,
  },
  {
    title: "Create server file",
    code: `// Save as index.js
${helloWorldCode}`,
  },
  {
    title: "Add to Claude Desktop",
    code: `// Add to claude_desktop_config.json
{
  "mcpServers": {
    "hello-world": {
      "command": "node",
      "args": ["path/to/hello-mcp/index.js"]
    }
  }
}`,
  },
];

export default function HelloWorldChallengePage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/challenges"
            className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Challenges
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Hello World
            </h1>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              Build Server
            </Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Beginner
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Create your first MCP server with a simple greeting tool.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold">Steps to Complete</h2>
          {steps.map((step, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-sm">
                    {index + 1}
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{step.code}</code>
                  </pre>
                  <button
                    onClick={() => copyCode(step.code, index)}
                    className="absolute top-2 right-2 p-2 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Playground */}
        <Card>
          <CardHeader>
            <CardTitle>Try it in the Playground</CardTitle>
          </CardHeader>
          <CardContent>
            <MCPPlayground
              initialCode={helloWorldCode}
              height="400px"
              showToolTester={true}
              title="Hello World Server"
              description="Your first MCP server"
            />
          </CardContent>
        </Card>

        {/* Success Criteria */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Success Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Server starts without errors
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">greet</code> tool accepts a name parameter
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">hello</code> tool returns &quot;Hello, World!&quot;
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
