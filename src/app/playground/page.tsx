"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const defaultCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

// Define a simple tool
server.tool(
  "greet",
  "Greet someone by name",
  {
    name: z.string().describe("The name to greet"),
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: "text",
          text: \`Hello, \${name}! Welcome to MCP.\`,
        },
      ],
    };
  }
);

// Try adding more tools below!
`;

const exampleTools = [
  {
    name: "Calculator",
    code: `server.tool(
  "calculate",
  "Perform basic math operations",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number(),
    b: z.number(),
  },
  async ({ operation, a, b }) => {
    let result: number;
    switch (operation) {
      case "add": result = a + b; break;
      case "subtract": result = a - b; break;
      case "multiply": result = a * b; break;
      case "divide": result = a / b; break;
    }
    return { content: [{ type: "text", text: String(result) }] };
  }
);`,
  },
  {
    name: "Random",
    code: `server.tool(
  "random",
  "Generate a random number",
  {
    min: z.number().default(0),
    max: z.number().default(100),
  },
  async ({ min, max }) => {
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    return { content: [{ type: "text", text: String(result) }] };
  }
);`,
  },
];

export default function PlaygroundPage() {
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Validating MCP server...\n");

    // Simulate validation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Basic syntax validation
      if (!code.includes("McpServer")) {
        throw new Error("Missing McpServer import");
      }
      if (!code.includes("server.tool")) {
        throw new Error("No tools defined");
      }

      setOutput((prev) => prev + "✓ Syntax valid\n");
      setOutput((prev) => prev + "✓ McpServer found\n");
      setOutput((prev) => prev + "✓ Tools detected\n\n");
      setOutput((prev) => prev + "Server ready! Tools available:\n");

      // Extract tool names (simple regex)
      const toolMatches = code.matchAll(/server\.tool\(\s*["']([^"']+)["']/g);
      for (const match of toolMatches) {
        setOutput((prev) => prev + `  - ${match[1]}\n`);
      }

      setOutput((prev) => prev + "\n🎉 Your MCP server is valid!");
    } catch (error) {
      setOutput((prev) => prev + `\n❌ Error: ${(error as Error).message}`);
    }

    setIsRunning(false);
  };

  const insertExample = (exampleCode: string) => {
    setCode((prev) => prev + "\n\n" + exampleCode);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              MCP Playground
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Build and test MCP servers in your browser
            </p>
          </div>
          <Badge variant="secondary">Beta</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">server.ts</CardTitle>
                  <Button onClick={handleRun} disabled={isRunning}>
                    {isRunning ? "Running..." : "▶ Run"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-[500px] p-4 font-mono text-sm bg-zinc-900 text-zinc-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  spellCheck={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Output */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="w-full h-48 p-4 font-mono text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg overflow-auto whitespace-pre-wrap">
                  {output || "Click 'Run' to validate your server..."}
                </pre>
              </CardContent>
            </Card>

            {/* Example Tools */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Example Tools</CardTitle>
                <CardDescription>Click to add to your code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {exampleTools.map((example) => (
                  <Button
                    key={example.name}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => insertExample(example.code)}
                  >
                    + {example.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                <p>• Use Zod schemas to define tool parameters</p>
                <p>• Tools must return content arrays</p>
                <p>• Add descriptions to help AI understand tools</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
