"use client";

export const runtime = "edge";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Terminal,
  Globe,
  Radio,
  Lightbulb,
  AlertCircle,
  Sparkles,
  FileCode,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";

interface TransportType {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  useCase: string;
  pros: string[];
  cons: string[];
  color: string;
}

const transports: TransportType[] = [
  {
    id: "stdio",
    name: "Stdio Transport",
    icon: Terminal,
    description: "Standard input/output communication for local servers",
    useCase: "Local development, CLI tools, desktop applications",
    pros: [
      "Simple to implement and debug",
      "No network overhead",
      "Works great with Claude Desktop",
      "Perfect for local file system access"
    ],
    cons: [
      "Only works locally",
      "Cannot be accessed remotely",
      "One client per server process"
    ],
    color: "bg-blue-500"
  },
  {
    id: "sse",
    name: "HTTP/SSE Transport",
    icon: Globe,
    description: "Server-Sent Events for web-based servers",
    useCase: "Web services, cloud deployments, public APIs",
    pros: [
      "Works over HTTP/HTTPS",
      "Can be hosted remotely",
      "Standard web protocols",
      "Easy to scale and load balance"
    ],
    cons: [
      "More complex setup",
      "Requires web server infrastructure",
      "Higher latency than local stdio"
    ],
    color: "bg-green-500"
  },
  {
    id: "websocket",
    name: "WebSocket Transport",
    icon: Radio,
    description: "Bidirectional communication for real-time applications",
    useCase: "Real-time updates, collaborative tools, streaming data",
    pros: [
      "Full-duplex communication",
      "Low latency for real-time updates",
      "Efficient for streaming data",
      "Works across networks"
    ],
    cons: [
      "More complex to implement",
      "Requires persistent connections",
      "May need connection management"
    ],
    color: "bg-purple-500"
  }
];

const codeBlocks = {
  stdio: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "stdio-server",
  version: "1.0.0",
});

// Add your tools
server.tool(
  "get_time",
  "Get the current time",
  {},
  async () => ({
    content: [{
      type: "text",
      text: \`Current time: \${new Date().toISOString()}\`
    }],
  })
);

// Connect using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Stdio MCP Server running...");`,

  sse: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { z } from "zod";

const app = express();
const server = new McpServer({
  name: "sse-server",
  version: "1.0.0",
});

// Add your tools
server.tool(
  "get_time",
  "Get the current time",
  {},
  async () => ({
    content: [{
      type: "text",
      text: \`Current time: \${new Date().toISOString()}\`
    }],
  })
);

// SSE endpoint
app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

// Message endpoint for client requests
app.post("/message", express.json(), async (req, res) => {
  // Handle incoming messages
  res.json({ status: "received" });
});

app.listen(3000, () => {
  console.log("SSE MCP Server running on http://localhost:3000");
});`,

  websocket: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebSocketServerTransport } from "@modelcontextprotocol/sdk/server/websocket.js";
import { WebSocketServer } from "ws";
import { z } from "zod";

const server = new McpServer({
  name: "websocket-server",
  version: "1.0.0",
});

// Add your tools
server.tool(
  "get_time",
  "Get the current time",
  {},
  async () => ({
    content: [{
      type: "text",
      text: \`Current time: \${new Date().toISOString()}\`
    }],
  })
);

// Create WebSocket server
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", async (ws) => {
  console.log("Client connected");

  const transport = new WebSocketServerTransport(ws);
  await server.connect(transport);

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket MCP Server running on ws://localhost:8080");`,

  comparison: `// Stdio - Best for local development
const stdioTransport = new StdioServerTransport();

// SSE - Best for web services
const sseTransport = new SSEServerTransport("/message", res);

// WebSocket - Best for real-time apps
const wsTransport = new WebSocketServerTransport(ws);`,
};

function CodeBlock({ code, language = "typescript", filename }: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {filename && (
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border-b border-zinc-700 rounded-t-lg">
          <FileCode className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-400">{filename}</span>
        </div>
      )}
      <div className={`relative ${filename ? "rounded-b-lg" : "rounded-lg"} bg-zinc-900 overflow-hidden`}>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-zinc-400" />
          )}
        </button>
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm text-zinc-100">{code}</code>
        </pre>
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg my-4">
      <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800 dark:text-amber-200">{children}</div>
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg my-4">
      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-blue-800 dark:text-blue-200">{children}</div>
    </div>
  );
}

export default function MCPTransportsPage() {
  const [activeTransport, setActiveTransport] = useState<string>("stdio");

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
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            intermediate
          </Badge>
          <Badge variant="secondary">10 min read</Badge>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          MCP Transport Protocols
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Learn about the different ways to connect MCP clients and servers.
        </p>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-zinc-600 dark:text-zinc-400">
              MCP supports multiple transport protocols to suit different use cases. The transport layer
              handles communication between the MCP client and server, but the MCP protocol itself remains
              the same regardless of which transport you choose.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Transport Types Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Transport Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {transports.map((transport) => (
            <button
              key={transport.id}
              onClick={() => setActiveTransport(transport.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                activeTransport === transport.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
              }`}
            >
              <div className={`p-3 rounded-full ${transport.color} text-white inline-flex mb-3`}>
                <transport.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                {transport.name}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {transport.description}
              </p>
            </button>
          ))}
        </div>

        {/* Active Transport Details */}
        {transports.map((transport) => (
          activeTransport === transport.id && (
            <Card key={transport.id} className="border-2 border-blue-300 dark:border-blue-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <transport.icon className="h-5 w-5" />
                  {transport.name}
                </CardTitle>
                <CardDescription>{transport.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Best for:</h4>
                  <p className="text-zinc-600 dark:text-zinc-400">{transport.useCase}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">
                      Pros
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {transport.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-600 dark:text-zinc-400">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">
                      Cons
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {transport.cons.map((con, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-600 dark:text-zinc-400">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </section>

      {/* Code Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Code Examples</h2>

        <Tabs defaultValue="stdio" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stdio">
              <Terminal className="h-4 w-4 mr-2" />
              Stdio
            </TabsTrigger>
            <TabsTrigger value="sse">
              <Globe className="h-4 w-4 mr-2" />
              HTTP/SSE
            </TabsTrigger>
            <TabsTrigger value="websocket">
              <Radio className="h-4 w-4 mr-2" />
              WebSocket
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stdio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Stdio Transport
                </CardTitle>
                <CardDescription>
                  Perfect for local development and Claude Desktop integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeBlock code={codeBlocks.stdio} filename="stdio-server.js" />

                <Tip>
                  Stdio is the default transport for Claude Desktop. Use <code>console.error()</code> for
                  logging since <code>stdout</code> is used for MCP messages.
                </Tip>

                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Running with Claude Desktop:</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Add to <code>claude_desktop_config.json</code>:
                  </p>
                  <pre className="text-xs bg-zinc-900 text-zinc-100 p-3 rounded overflow-x-auto">
{`{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/stdio-server.js"]
    }
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  HTTP/SSE Transport
                </CardTitle>
                <CardDescription>
                  Server-Sent Events for web-based deployments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Info>
                  You&apos;ll need to install Express: <code>npm install express</code>
                </Info>

                <CodeBlock code={codeBlocks.sse} filename="sse-server.js" />

                <Tip>
                  SSE transport is ideal for hosting MCP servers as web services. Clients connect via
                  HTTP and receive updates through Server-Sent Events.
                </Tip>

                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Starting the server:</h4>
                  <pre className="text-xs bg-zinc-900 text-zinc-100 p-3 rounded overflow-x-auto">
                    node sse-server.js
                  </pre>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Server will be available at <code>http://localhost:3000</code>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="websocket" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  WebSocket Transport
                </CardTitle>
                <CardDescription>
                  Full-duplex communication for real-time applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Info>
                  You&apos;ll need to install the ws package: <code>npm install ws</code>
                </Info>

                <CodeBlock code={codeBlocks.websocket} filename="websocket-server.js" />

                <Tip>
                  WebSocket transport provides bidirectional, real-time communication. Perfect for
                  collaborative tools or applications that need instant updates.
                </Tip>

                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Starting the server:</h4>
                  <pre className="text-xs bg-zinc-900 text-zinc-100 p-3 rounded overflow-x-auto">
                    node websocket-server.js
                  </pre>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Clients can connect to <code>ws://localhost:8080</code>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Comparison Table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Quick Comparison</h2>
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-left py-3 px-4 font-semibold">Stdio</th>
                  <th className="text-left py-3 px-4 font-semibold">HTTP/SSE</th>
                  <th className="text-left py-3 px-4 font-semibold">WebSocket</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 dark:text-zinc-400">
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <td className="py-3 px-4 font-medium">Local/Remote</td>
                  <td className="py-3 px-4">Local only</td>
                  <td className="py-3 px-4">Both</td>
                  <td className="py-3 px-4">Both</td>
                </tr>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <td className="py-3 px-4 font-medium">Complexity</td>
                  <td className="py-3 px-4">Simple</td>
                  <td className="py-3 px-4">Moderate</td>
                  <td className="py-3 px-4">Moderate</td>
                </tr>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <td className="py-3 px-4 font-medium">Performance</td>
                  <td className="py-3 px-4">Excellent</td>
                  <td className="py-3 px-4">Good</td>
                  <td className="py-3 px-4">Excellent</td>
                </tr>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <td className="py-3 px-4 font-medium">Real-time</td>
                  <td className="py-3 px-4">Yes</td>
                  <td className="py-3 px-4">One-way</td>
                  <td className="py-3 px-4">Yes</td>
                </tr>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <td className="py-3 px-4 font-medium">Best For</td>
                  <td className="py-3 px-4">Desktop apps</td>
                  <td className="py-3 px-4">Web services</td>
                  <td className="py-3 px-4">Real-time apps</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Claude Desktop</td>
                  <td className="py-3 px-4">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </td>
                  <td className="py-3 px-4">
                    <Check className="h-4 w-4 text-zinc-400" />
                  </td>
                  <td className="py-3 px-4">
                    <Check className="h-4 w-4 text-zinc-400" />
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* When to Use Each */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">When to Use Each Transport</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="h-5 w-5 text-blue-500" />
                Use Stdio When...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  You&apos;re building a tool for Claude Desktop
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  Your server needs local file system access
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  You want the simplest setup for development
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  You don&apos;t need remote access
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-500" />
                Use HTTP/SSE When...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  You&apos;re deploying a public API or web service
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  You need to serve multiple clients
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  You want to use standard HTTP infrastructure
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  You need server-to-client updates
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="h-5 w-5 text-purple-500" />
                Use WebSocket When...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  You need bidirectional real-time communication
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  You&apos;re building collaborative tools
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  You need low-latency updates
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  You&apos;re streaming data or events
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive Playground */}
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Try It in the Playground
            </CardTitle>
            <CardDescription>
              Experiment with different transport implementations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Info>
              Instead of setting up a local environment, you can test MCP servers with different
              transports right in our interactive playground. Try modifying the code and testing
              the tools!
            </Info>
            <MCPPlayground
              initialCode={codeBlocks.stdio}
              height="450px"
              showToolTester={true}
              title="Transport Playground"
              description="Try changing the transport implementation and testing the server"
            />
          </CardContent>
        </Card>
      </section>

      {/* Key Takeaways */}
      <section className="mb-12">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-blue-500" />
              Key Takeaways
            </h3>
            <ul className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  The transport layer handles communication, but the MCP protocol stays the same
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  Stdio is perfect for local development and Claude Desktop integration
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  HTTP/SSE enables web-based deployments and public APIs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  WebSocket provides bidirectional real-time communication
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  Choose based on your deployment needs and use case
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Next Steps */}
      <section className="mb-8">
        <Card className="bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Ready for more?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Now that you understand MCP transports, explore more advanced topics or try building something!
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/learn/first-mcp-server">
                  Build Your First Server
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/playground">Try Playground</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/learn">Back to Lessons</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
