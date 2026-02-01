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
  FileText,
  MessageSquare,
  Database,
  Lightbulb,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  FileCode,
  Code2,
} from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";

const codeBlocks = {
  basicResource: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "resources-server",
  version: "1.0.0",
});

// Define a simple text resource
server.resource(
  "config://app",                          // Resource URI
  "Application configuration",             // Description
  "text/plain",                           // MIME type
  async () => {                           // Handler function
    const config = {
      app: "MyApp",
      version: "1.0.0",
      environment: "production"
    };

    return {
      contents: [{
        uri: "config://app",
        mimeType: "text/plain",
        text: JSON.stringify(config, null, 2)
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,

  resourceWithParams: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "user-db-server",
  version: "1.0.0",
});

// Resource with dynamic URI parameters
server.resource(
  "user://{userId}",                      // URI template
  "User profile by ID",                   // Description
  "application/json",                     // MIME type
  async (uri) => {                        // Handler receives the URI
    // Extract userId from the URI
    const userId = uri.split("://")[1];

    // In a real app, fetch from database
    const users: Record<string, any> = {
      "1": { id: 1, name: "Alice", role: "admin" },
      "2": { id: 2, name: "Bob", role: "user" },
      "3": { id: 3, name: "Charlie", role: "user" }
    };

    const user = users[userId];

    if (!user) {
      throw new Error(\`User \${userId} not found\`);
    }

    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(user, null, 2)
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,

  basicPrompt: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "prompts-server",
  version: "1.0.0",
});

// Define a simple prompt template
server.prompt(
  "code-review",                          // Prompt name
  "Review code for best practices",       // Description
  async () => {                           // Handler function
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: \`Please review this code for:
- Code quality and readability
- Best practices
- Potential bugs
- Performance issues
- Security concerns

Provide specific, actionable feedback.\`
          }
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,

  promptWithParams: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "prompts-server",
  version: "1.0.0",
});

// Prompt with parameters using Zod
server.prompt(
  "summarize-document",
  "Summarize a document with specific style",
  {
    style: z.enum(["brief", "detailed", "bullet-points"])
      .describe("Summary style"),
    maxLength: z.number().optional()
      .describe("Maximum length in words")
  },
  async ({ style, maxLength }) => {
    let instruction = "";

    switch (style) {
      case "brief":
        instruction = "Provide a brief 1-2 sentence summary.";
        break;
      case "detailed":
        instruction = "Provide a comprehensive summary covering all key points.";
        break;
      case "bullet-points":
        instruction = "Summarize as a list of bullet points.";
        break;
    }

    if (maxLength) {
      instruction += \` Keep it under \${maxLength} words.\`;
    }

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: \`Summarize the following document:\\n\\n\${instruction}\`
          }
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,

  combined: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "docs-server",
  version: "1.0.0",
});

// Resource: Expose documentation files
server.resource(
  "docs://{category}/{page}",
  "Documentation pages",
  "text/markdown",
  async (uri) => {
    const [category, page] = uri.split("://")[1].split("/");

    // In real app, read from file system or database
    const docs: Record<string, any> = {
      "getting-started/installation": "# Installation\\n\\nRun: npm install...",
      "getting-started/quickstart": "# Quick Start\\n\\nCreate your first...",
      "api/authentication": "# Authentication\\n\\nUse API keys to..."
    };

    const content = docs[\`\${category}/\${page}\`];

    if (!content) {
      throw new Error(\`Doc not found: \${category}/\${page}\`);
    }

    return {
      contents: [{
        uri,
        mimeType: "text/markdown",
        text: content
      }]
    };
  }
);

// Prompt: Help users search documentation
server.prompt(
  "find-docs",
  "Search documentation by topic",
  {
    topic: z.string().describe("Topic to search for")
  },
  async ({ topic }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: \`Find documentation about: \${topic}\\n\\nSearch through available docs:// resources and provide relevant links and summaries.\`
          }
        }
      ]
    };
  }
);

// Tool: List all available docs
server.tool(
  "list-docs",
  "List all documentation pages",
  {},
  async () => {
    const docsList = [
      "docs://getting-started/installation",
      "docs://getting-started/quickstart",
      "docs://api/authentication"
    ];

    return {
      content: [{
        type: "text",
        text: "Available documentation:\\n" + docsList.join("\\n")
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,
};

function CodeBlock({ code, language = "typescript", filename }: { code: string; language?: string; filename?: string }) {
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

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg my-4">
      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-blue-800 dark:text-blue-200">{children}</div>
    </div>
  );
}

export default function MCPResourcesPage() {
  const [activeTab, setActiveTab] = useState("resources");

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
          <Badge variant="secondary">20 min</Badge>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          MCP Resources &amp; Prompts
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Learn how to expose data with resources and create reusable prompt templates.
        </p>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Beyond tools, MCP servers can expose two other powerful capabilities:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <Database className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Resources</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Expose data sources that AI can read from (files, databases, APIs)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MessageSquare className="h-6 w-6 text-purple-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Prompts</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Create reusable prompt templates with parameters
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resources">
            <Database className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <MessageSquare className="h-4 w-4 mr-2" />
            Prompts
          </TabsTrigger>
        </TabsList>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-8">
          {/* What are Resources */}
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <Database className="h-6 w-6" />
              What are Resources?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Resources allow MCP servers to expose data sources to AI. Think of them as read-only
              endpoints that provide content like files, database records, API responses, or any other data.
            </p>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resource Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <Code2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <strong className="text-zinc-900 dark:text-zinc-50">URI:</strong> Unique identifier
                      (e.g., <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">file:///config.json</code>,{" "}
                      <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">user://123</code>)
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <FileText className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <strong className="text-zinc-900 dark:text-zinc-50">MIME Type:</strong> Content type
                      (<code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">text/plain</code>,{" "}
                      <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">application/json</code>, etc.)
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <div>
                      <strong className="text-zinc-900 dark:text-zinc-50">Content:</strong> The actual data
                      (text, JSON, binary, etc.)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Basic Resource Example */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Basic Resource Example</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Here&apos;s a simple resource that exposes configuration data:
            </p>
            <CodeBlock code={codeBlocks.basicResource} filename="index.js" />

            <Tip>
              Resources use URI schemes (like <code>config://</code>) to organize data.
              The scheme can be anything meaningful for your use case!
            </Tip>
          </section>

          {/* Dynamic Resources */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Dynamic Resources with Parameters</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Resources can use URI templates to handle dynamic data. Here&apos;s an example
              that retrieves user profiles by ID:
            </p>
            <CodeBlock code={codeBlocks.resourceWithParams} filename="user-server.js" />

            <InfoBox>
              <strong>How it works:</strong> When AI requests <code>user://1</code>, the handler
              extracts &quot;1&quot; from the URI and returns that user&apos;s data. The same resource
              definition handles all user IDs!
            </InfoBox>
          </section>

          {/* Resource Use Cases */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Common Resource Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <strong>Files:</strong> <code className="text-xs">file:///path/to/file.txt</code>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <strong>Database:</strong> <code className="text-xs">db://users/123</code>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <strong>API Data:</strong> <code className="text-xs">api://weather/london</code>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <strong>Config:</strong> <code className="text-xs">config://app/settings</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-8">
          {/* What are Prompts */}
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <MessageSquare className="h-6 w-6" />
              What are Prompts?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Prompts are reusable templates that help users accomplish common tasks. Instead of
              typing the same instructions repeatedly, you can define prompt templates that can
              be called with parameters.
            </p>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Use Prompts?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Consistency:</strong> Ensure the same instructions are used every time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Reusability:</strong> Save time by not rewriting common prompts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Standardization:</strong> Share best practices across your team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Customization:</strong> Use parameters to adapt prompts to different contexts</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Basic Prompt Example */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Basic Prompt Example</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Here&apos;s a simple prompt template for code reviews:
            </p>
            <CodeBlock code={codeBlocks.basicPrompt} filename="index.js" />

            <Tip>
              Users can invoke this prompt in Claude and it will automatically provide the
              code review instructions!
            </Tip>
          </section>

          {/* Prompts with Parameters */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Prompts with Parameters</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Make prompts more flexible by accepting parameters with Zod schemas:
            </p>
            <CodeBlock code={codeBlocks.promptWithParams} filename="prompts-server.js" />

            <InfoBox>
              <strong>Parameters make prompts dynamic!</strong> The same prompt can adapt to different
              needs - a brief summary for quick reviews, detailed for research, or bullet points for presentations.
            </InfoBox>
          </section>

          {/* Prompt Use Cases */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Common Prompt Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <strong className="text-zinc-900 dark:text-zinc-50">Code Review:</strong>{" "}
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Analyze code for quality, bugs, and best practices
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <strong className="text-zinc-900 dark:text-zinc-50">Document Summary:</strong>{" "}
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Summarize documents in different styles and lengths
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <strong className="text-zinc-900 dark:text-zinc-50">Bug Report:</strong>{" "}
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Generate structured bug reports from descriptions
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
                    <strong className="text-zinc-900 dark:text-zinc-50">Test Generation:</strong>{" "}
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Create unit tests for specific functions or modules
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>

      {/* Combining Resources, Prompts, and Tools */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6" />
          Putting It All Together
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Resources, prompts, and tools work together to create powerful MCP servers.
          Here&apos;s an example documentation server that combines all three:
        </p>
        <CodeBlock code={codeBlocks.combined} filename="docs-server.js" />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-green-500" />
                Resource
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Exposes documentation files via <code className="text-xs">docs://</code> URIs
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Helps users search and find relevant documentation
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-500" />
                Tool
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Lists all available documentation pages
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
              Experiment with resources and prompts without setting up a local environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InfoBox>
              <strong>No local setup required!</strong> You can test all the code examples above
              directly in our interactive playground. Just copy the code, paste it in the playground,
              and try it out.
            </InfoBox>
            <MCPPlayground
              initialCode={codeBlocks.combined}
              height="500px"
              showToolTester={true}
              title="Resources & Prompts Playground"
              description="Try resources, prompts, and tools together"
            />
            <div className="mt-4 flex justify-center">
              <Button asChild variant="outline">
                <Link href="/playground">
                  Open Full Playground
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Key Takeaways */}
      <section className="mb-12">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-blue-500" />
              Key Takeaways
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Resources</h4>
                <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                  <li>• Expose data sources to AI</li>
                  <li>• Use URI schemes for organization</li>
                  <li>• Support dynamic parameters in URIs</li>
                  <li>• Specify appropriate MIME types</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Prompts</h4>
                <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                  <li>• Create reusable prompt templates</li>
                  <li>• Accept parameters with Zod schemas</li>
                  <li>• Ensure consistency across uses</li>
                  <li>• Combine with resources and tools</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Next Steps */}
      <section className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold mb-2">Ready for More?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              You now know how to create tools, resources, and prompts. Try building a complete
              MCP server in the challenges!
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/challenges">
                  Try Challenges
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/playground">
                  Open Playground
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/learn">
                  Back to Learn
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
