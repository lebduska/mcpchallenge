"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, CheckCircle2, Copy } from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";
import { useState } from "react";

const calculatorCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "calculator-server",
  version: "1.0.0",
});

// Add two numbers
server.tool(
  "add",
  "Add two numbers together",
  {
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  },
  async ({ a, b }) => ({
    content: [{
      type: "text",
      text: \`\${a} + \${b} = \${a + b}\`,
    }],
  })
);

// Subtract
server.tool(
  "subtract",
  "Subtract b from a",
  {
    a: z.number().describe("First number"),
    b: z.number().describe("Number to subtract"),
  },
  async ({ a, b }) => ({
    content: [{
      type: "text",
      text: \`\${a} - \${b} = \${a - b}\`,
    }],
  })
);

// Multiply
server.tool(
  "multiply",
  "Multiply two numbers",
  {
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  },
  async ({ a, b }) => ({
    content: [{
      type: "text",
      text: \`\${a} × \${b} = \${a * b}\`,
    }],
  })
);

// Divide
server.tool(
  "divide",
  "Divide a by b",
  {
    a: z.number().describe("Dividend"),
    b: z.number().describe("Divisor"),
  },
  async ({ a, b }) => {
    if (b === 0) {
      return {
        content: [{
          type: "text",
          text: "Error: Cannot divide by zero!",
        }],
        isError: true,
      };
    }
    return {
      content: [{
        type: "text",
        text: \`\${a} ÷ \${b} = \${a / b}\`,
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

export default function CalculatorChallengePage() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(calculatorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <Calculator className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Calculator Tool
            </h1>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              Build Server
            </Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Beginner
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Build a calculator MCP server with basic math operations.
          </p>
        </div>

        {/* Learning Goals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What You&apos;ll Learn</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>• Working with numeric parameters using Zod schemas</li>
              <li>• Returning error states with <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">isError: true</code></li>
              <li>• Creating multiple related tools in one server</li>
            </ul>
          </CardContent>
        </Card>

        {/* Playground */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Calculator MCP Server
              <button
                onClick={copyCode}
                className="text-sm px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1"
              >
                {copied ? (
                  <><CheckCircle2 className="h-4 w-4 text-green-500" /> Copied!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy</>
                )}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MCPPlayground
              initialCode={calculatorCode}
              height="500px"
              showToolTester={true}
              title="Calculator Server"
              description="Basic math operations"
            />
          </CardContent>
        </Card>

        {/* Bonus Challenge */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-600 dark:text-amber-400">
              🌟 Bonus Challenge
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-600 dark:text-zinc-400">
            <p className="mb-4">Extend the calculator with these additional tools:</p>
            <ul className="space-y-2">
              <li>• <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">power</code> - Calculate a^b</li>
              <li>• <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">sqrt</code> - Square root</li>
              <li>• <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">modulo</code> - Remainder after division</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
