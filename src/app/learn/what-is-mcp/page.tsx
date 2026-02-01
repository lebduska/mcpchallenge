"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Database,
  FileText,
  Globe,
  MessageSquare,
  Plug,
  CheckCircle2,
  Circle,
  Zap,
  Shield,
  Blocks,
  Sparkles,
} from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";

const architectureLayers = [
  {
    id: "host",
    label: "Host Application",
    description: "Claude Desktop, IDE, or your app",
    icon: Cpu,
    color: "bg-blue-500",
  },
  {
    id: "client",
    label: "MCP Client",
    description: "Connects to MCP servers",
    icon: Plug,
    color: "bg-purple-500",
  },
  {
    id: "server",
    label: "MCP Server",
    description: "Exposes tools, resources, prompts",
    icon: Database,
    color: "bg-green-500",
  },
  {
    id: "service",
    label: "External Service",
    description: "APIs, databases, file systems",
    icon: Globe,
    color: "bg-orange-500",
  },
];

const mcpCapabilities = [
  {
    name: "Tools",
    description: "Functions the AI can call to perform actions",
    icon: Zap,
    example: "weather.get, files.read, database.query",
  },
  {
    name: "Resources",
    description: "Data sources the AI can read from",
    icon: FileText,
    example: "file://config.json, db://users",
  },
  {
    name: "Prompts",
    description: "Reusable prompt templates",
    icon: MessageSquare,
    example: "code-review, summarize-document",
  },
];

const quizQuestions = [
  {
    question: "What does MCP stand for?",
    options: [
      "Model Control Panel",
      "Model Context Protocol",
      "Machine Communication Protocol",
      "Multi-Client Protocol",
    ],
    correct: 1,
  },
  {
    question: "Who created MCP?",
    options: ["OpenAI", "Google", "Anthropic", "Microsoft"],
    correct: 2,
  },
  {
    question: "What can MCP servers expose?",
    options: [
      "Only tools",
      "Only resources",
      "Tools, resources, and prompts",
      "Only API endpoints",
    ],
    correct: 2,
  },
];

export default function WhatIsMCPPage() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([null, null, null]);
  const [showResults, setShowResults] = useState(false);

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const score = quizAnswers.reduce<number>((acc, answer, index) => {
    return acc + (answer === quizQuestions[index].correct ? 1 : 0);
  }, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/learn"
          className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Learn
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            beginner
          </Badge>
          <Badge variant="secondary">5 min read</Badge>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          What is MCP?
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          An introduction to the Model Context Protocol and why it matters for AI applications.
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Blocks className="h-6 w-6" />
            The Problem MCP Solves
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-4">
            AI assistants like Claude are powerful, but they&apos;re isolated by default. They can&apos;t
            access your files, query your databases, or interact with your tools. Every integration
            requires custom code.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-red-600 dark:text-red-400">Without MCP</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                <ul className="space-y-2">
                  <li>• Custom integration for each tool</li>
                  <li>• No standardized communication</li>
                  <li>• Security concerns with each connection</li>
                  <li>• Difficult to maintain and scale</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-600 dark:text-green-400">With MCP</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                <ul className="space-y-2">
                  <li>• One protocol for all integrations</li>
                  <li>• Standardized tool/resource format</li>
                  <li>• Built-in security model</li>
                  <li>• Easy to extend and maintain</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Architecture Diagram */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6" />
            MCP Architecture
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-4 mb-6">
            MCP uses a client-server architecture. Click on each layer to learn more:
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 p-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            {architectureLayers.map((layer, index) => (
              <div key={layer.id} className="flex items-center">
                <button
                  onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                  className={`flex flex-col items-center p-4 rounded-lg transition-all cursor-pointer
                    ${activeLayer === layer.id
                      ? "bg-white dark:bg-zinc-700 shadow-lg scale-105"
                      : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
                    }`}
                >
                  <div className={`p-3 rounded-full ${layer.color} text-white mb-2`}>
                    <layer.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {layer.label}
                  </span>
                </button>
                {index < architectureLayers.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-zinc-400 mx-2 hidden md:block" />
                )}
              </div>
            ))}
          </div>

          {activeLayer && (
            <Card className="mt-4 border-2 border-zinc-300 dark:border-zinc-600">
              <CardContent className="pt-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  <strong>{architectureLayers.find(l => l.id === activeLayer)?.label}:</strong>{" "}
                  {architectureLayers.find(l => l.id === activeLayer)?.description}
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Capabilities */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            What MCP Servers Can Expose
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-4 mb-6">
            MCP servers can expose three types of capabilities:
          </p>

          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {mcpCapabilities.map((cap) => (
                <TabsTrigger key={cap.name.toLowerCase()} value={cap.name.toLowerCase()}>
                  <cap.icon className="h-4 w-4 mr-2" />
                  {cap.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {mcpCapabilities.map((cap) => (
              <TabsContent key={cap.name.toLowerCase()} value={cap.name.toLowerCase()}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <cap.icon className="h-5 w-5" />
                      {cap.name}
                    </CardTitle>
                    <CardDescription>{cap.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-mono text-sm">
                      Examples: {cap.example}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* Code Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Simple Example
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-4 mb-6">
            Here&apos;s what a simple MCP tool looks like:
          </p>

          <div className="p-4 bg-zinc-900 rounded-lg overflow-x-auto">
            <pre className="text-sm text-zinc-100">
{`import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-first-server",
  version: "1.0.0",
});

// Define a tool
server.tool(
  "greet",                              // Tool name
  "Say hello to someone",               // Description
  { name: z.string() },                 // Input schema
  async ({ name }) => ({                // Handler
    content: [{ type: "text", text: \`Hello, \${name}!\` }],
  })
);`}
            </pre>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Key Points:</strong> Tools have a name, description, input schema (using Zod),
              and a handler function that returns content.
            </p>
          </div>
        </section>

        {/* Interactive Playground */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Try It Live
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-4 mb-6">
            Experiment with MCP server code right in your browser:
          </p>
          <MCPPlayground
            initialCode={`import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-first-server",
  version: "1.0.0",
});

// Try editing this tool!
server.tool(
  "greet",
  "Say hello to someone",
  { name: z.string().describe("Name to greet") },
  async ({ name }) => ({
    content: [{ type: "text", text: \`Hello, \${name}! 👋\` }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);`}
            height="400px"
            showToolTester={true}
            title="Interactive MCP Playground"
            description="Edit the code and click 'Test Tools' to try calling the tool"
          />
        </section>

        {/* Quiz */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            Quick Quiz
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-4 mb-6">
            Test your understanding:
          </p>

          <div className="space-y-6">
            {quizQuestions.map((q, qIndex) => (
              <Card key={qIndex}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {qIndex + 1}. {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        onClick={() => handleQuizAnswer(qIndex, oIndex)}
                        disabled={showResults}
                        className={`p-3 text-left rounded-lg border transition-all flex items-center gap-2
                          ${quizAnswers[qIndex] === oIndex
                            ? showResults
                              ? oIndex === q.correct
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : "border-red-500 bg-red-50 dark:bg-red-900/20"
                              : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : showResults && oIndex === q.correct
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                          }
                          ${showResults ? "cursor-default" : "cursor-pointer"}
                        `}
                      >
                        {quizAnswers[qIndex] === oIndex ? (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-zinc-400" />
                        )}
                        <span className="text-sm">{option}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button
              onClick={() => setShowResults(true)}
              disabled={quizAnswers.includes(null) || showResults}
            >
              Check Answers
            </Button>
            {showResults && (
              <div className="flex items-center gap-2">
                <Badge variant={score === 3 ? "default" : "secondary"}>
                  Score: {score}/3
                </Badge>
                {score === 3 && <span className="text-green-600 dark:text-green-400">Perfect!</span>}
              </div>
            )}
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-2">Ready to build?</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Now that you understand what MCP is, let&apos;s create your first MCP server!
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/learn/first-mcp-server">
                    Next: Your First MCP Server
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/playground">Try Playground</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
