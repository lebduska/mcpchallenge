"use client";

export const runtime = "edge";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MCPPlayground } from "@/components/playground/mcp-playground";
import {
  BookOpen,
  Lightbulb,
  Code2,
  Zap,
  Calculator,
  Shuffle,
  Clock,
  Hash,
} from "lucide-react";
import Link from "next/link";

const templates = [
  {
    id: "starter",
    name: "Starter Template",
    description: "Basic server with greeting tool",
    icon: Code2,
    code: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "starter-server",
  version: "1.0.0",
});

// Simple greeting tool
server.tool(
  "greet",
  "Say hello to someone",
  { name: z.string().describe("Name to greet") },
  async ({ name }) => ({
    content: [{ type: "text", text: \`Hello, \${name}! 👋\` }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);`,
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Math operations tool",
    icon: Calculator,
    code: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "calculator-server",
  version: "1.0.0",
});

server.tool(
  "calculate",
  "Perform math operations: add, subtract, multiply, divide",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  },
  async ({ operation, a, b }) => {
    const operations: Record<string, number> = {
      add: a + b,
      subtract: a - b,
      multiply: a * b,
      divide: b !== 0 ? a / b : NaN,
    };

    const result = operations[operation];
    const symbol = { add: "+", subtract: "-", multiply: "×", divide: "÷" };

    return {
      content: [{
        type: "text",
        text: \`\${a} \${symbol[operation]} \${b} = \${result}\`,
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,
  },
  {
    id: "random",
    name: "Random Generator",
    description: "Generate random numbers, UUIDs, choices",
    icon: Shuffle,
    code: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "random-server",
  version: "1.0.0",
});

// Random number in range
server.tool(
  "random_number",
  "Generate a random integer in a range",
  {
    min: z.number().default(1).describe("Minimum value"),
    max: z.number().default(100).describe("Maximum value"),
  },
  async ({ min, max }) => {
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    return { content: [{ type: "text", text: \`🎲 \${result}\` }] };
  }
);

// Random UUID
server.tool(
  "random_uuid",
  "Generate a random UUID",
  {},
  async () => {
    const uuid = crypto.randomUUID();
    return { content: [{ type: "text", text: uuid }] };
  }
);

// Random choice from list
server.tool(
  "random_choice",
  "Pick a random item from a comma-separated list",
  { items: z.string().describe("Comma-separated list of items") },
  async ({ items }) => {
    const list = items.split(",").map((s) => s.trim());
    const choice = list[Math.floor(Math.random() * list.length)];
    return { content: [{ type: "text", text: \`🎯 \${choice}\` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,
  },
  {
    id: "datetime",
    name: "Date & Time",
    description: "Current time, date formatting, timezone conversion",
    icon: Clock,
    code: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "datetime-server",
  version: "1.0.0",
});

// Current time
server.tool(
  "now",
  "Get current date and time",
  {
    timezone: z.string().optional().describe("Timezone (e.g., 'America/New_York')"),
  },
  async ({ timezone }) => {
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: timezone || "UTC",
    };
    const now = new Intl.DateTimeFormat("en-US", options).format(new Date());
    return { content: [{ type: "text", text: \`🕐 \${now}\` }] };
  }
);

// Format date
server.tool(
  "format_date",
  "Format a date string",
  {
    date: z.string().describe("Date to format (ISO string or timestamp)"),
    format: z.enum(["short", "medium", "long", "full"]).default("medium"),
  },
  async ({ date, format }) => {
    const d = new Date(date);
    const formatted = new Intl.DateTimeFormat("en-US", {
      dateStyle: format,
    }).format(d);
    return { content: [{ type: "text", text: formatted }] };
  }
);

// Days between dates
server.tool(
  "days_between",
  "Calculate days between two dates",
  {
    from: z.string().describe("Start date"),
    to: z.string().describe("End date"),
  },
  async ({ from, to }) => {
    const d1 = new Date(from);
    const d2 = new Date(to);
    const days = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return { content: [{ type: "text", text: \`📅 \${Math.abs(days)} days\` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,
  },
  {
    id: "text",
    name: "Text Utils",
    description: "String manipulation, counting, formatting",
    icon: Hash,
    code: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "text-utils-server",
  version: "1.0.0",
});

// Word count
server.tool(
  "word_count",
  "Count words, characters, and lines in text",
  { text: z.string().describe("Text to analyze") },
  async ({ text }) => {
    const words = text.split(/\\s+/).filter(Boolean).length;
    const chars = text.length;
    const lines = text.split("\\n").length;
    return {
      content: [{
        type: "text",
        text: \`📊 \${words} words, \${chars} chars, \${lines} lines\`,
      }],
    };
  }
);

// Slugify
server.tool(
  "slugify",
  "Convert text to URL-friendly slug",
  { text: z.string().describe("Text to slugify") },
  async ({ text }) => {
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return { content: [{ type: "text", text: slug }] };
  }
);

// Reverse
server.tool(
  "reverse",
  "Reverse a string",
  { text: z.string().describe("Text to reverse") },
  async ({ text }) => ({
    content: [{ type: "text", text: text.split("").reverse().join("") }],
  })
);

// Case conversion
server.tool(
  "convert_case",
  "Convert text case",
  {
    text: z.string().describe("Text to convert"),
    to: z.enum(["upper", "lower", "title", "sentence"]),
  },
  async ({ text, to }) => {
    const conversions: Record<string, string> = {
      upper: text.toUpperCase(),
      lower: text.toLowerCase(),
      title: text.replace(/\\b\\w/g, (c) => c.toUpperCase()),
      sentence: text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
    };
    return { content: [{ type: "text", text: conversions[to] }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,
  },
];

export default function PlaygroundPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                MCP Playground
              </h1>
              <Badge variant="secondary">Interactive</Badge>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Build, validate, and test MCP servers in your browser
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/learn">
              <BookOpen className="h-4 w-4 mr-2" />
              Learn First
            </Link>
          </Button>
        </div>

        {/* Templates */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Start with a template:
          </h2>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate.id === template.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTemplate(template)}
                className="gap-2"
              >
                <template.icon className="h-4 w-4" />
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Playground */}
        <MCPPlayground
          key={selectedTemplate.id}
          initialCode={selectedTemplate.code}
          height="500px"
          showToolTester={true}
          title={selectedTemplate.name}
          description={selectedTemplate.description}
        />

        {/* Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Tip: Descriptions Matter
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              AI uses your tool descriptions to decide when to use them.
              Be specific and clear!
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Tip: Test Your Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Use the &quot;Test Tools&quot; tab to simulate tool calls and verify
              your logic works correctly.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code2 className="h-4 w-4 text-green-500" />
                Tip: Use Zod Wisely
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Add <code>.describe()</code> to Zod schemas so AI knows
              what each parameter means.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
