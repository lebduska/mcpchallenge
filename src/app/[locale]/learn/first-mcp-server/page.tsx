"use client";

export const runtime = "edge";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Copy,
  Terminal,
  FileCode,
  FolderTree,
  Play,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, title: "Create Project", description: "Initialize a new Node.js project" },
  { id: 2, title: "Install Dependencies", description: "Add MCP SDK and Zod" },
  { id: 3, title: "Create Server", description: "Write your MCP server code" },
  { id: 4, title: "Add a Tool", description: "Define your first tool" },
  { id: 5, title: "Test It", description: "Run and test your server" },
];

const codeBlocks = {
  packageJson: `{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  }
}`,
  basicServer: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create the server
const server = new McpServer({
  name: "my-first-server",
  version: "1.0.0",
});

// Connect via stdio (standard input/output)
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("MCP Server running...");`,
  withTool: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-first-server",
  version: "1.0.0",
});

// Define a greeting tool
server.tool(
  "greet",
  "Say hello to someone with a personalized message",
  {
    name: z.string().describe("The name of the person to greet"),
    style: z.enum(["formal", "casual", "excited"]).optional()
      .describe("The greeting style"),
  },
  async ({ name, style = "casual" }) => {
    let greeting: string;

    switch (style) {
      case "formal":
        greeting = \`Good day, \${name}. It is a pleasure to meet you.\`;
        break;
      case "excited":
        greeting = \`OMG HI \${name.toUpperCase()}!!! SO GREAT TO SEE YOU! 🎉\`;
        break;
      default:
        greeting = \`Hey \${name}! Nice to meet you.\`;
    }

    return {
      content: [{ type: "text", text: greeting }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,
  withMultipleTools: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-first-server",
  version: "1.0.0",
});

// Tool 1: Greeting
server.tool(
  "greet",
  "Say hello to someone",
  { name: z.string() },
  async ({ name }) => ({
    content: [{ type: "text", text: \`Hello, \${name}!\` }],
  })
);

// Tool 2: Calculator
server.tool(
  "calculate",
  "Perform basic math",
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
      case "divide": result = b !== 0 ? a / b : NaN; break;
    }
    return {
      content: [{ type: "text", text: \`Result: \${result}\` }],
    };
  }
);

// Tool 3: Random number
server.tool(
  "random",
  "Generate a random number",
  {
    min: z.number().default(1),
    max: z.number().default(100),
  },
  async ({ min, max }) => ({
    content: [{
      type: "text",
      text: \`Random number: \${Math.floor(Math.random() * (max - min + 1)) + min}\`,
    }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);`,
  claudeConfig: `{
  "mcpServers": {
    "my-first-server": {
      "command": "node",
      "args": ["/path/to/your/project/index.js"]
    }
  }
}`,
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

function StepIndicator({ steps, currentStep, completedSteps }: {
  steps: Step[];
  currentStep: number;
  completedSteps: Set<number>;
}) {
  return (
    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap
              ${currentStep === step.id
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : completedSteps.has(step.id)
                  ? "text-green-600 dark:text-green-400"
                  : "text-zinc-500"
              }`}
          >
            {completedSteps.has(step.id) ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : currentStep === step.id ? (
              <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                {step.id}
              </div>
            ) : (
              <Circle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
          </button>
          {index < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 text-zinc-400 mx-1 hidden sm:block" />
          )}
        </div>
      ))}
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

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg my-4">
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-red-800 dark:text-red-200">{children}</div>
    </div>
  );
}

export default function FirstMCPServerPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["step1"]));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const markComplete = (stepId: number) => {
    setCompletedSteps(new Set([...completedSteps, stepId]));
    if (stepId < steps.length) {
      setCurrentStep(stepId + 1);
      setExpandedSections(new Set([`step${stepId + 1}`]));
    }
  };

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
          <Badge variant="secondary">15 min</Badge>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Your First MCP Server
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Build a working MCP server from scratch in 5 steps.
        </p>
      </div>

      {/* Progress */}
      <StepIndicator steps={steps} currentStep={currentStep} completedSteps={completedSteps} />

      {/* Prerequisites */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Node.js 18+ installed
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Basic TypeScript/JavaScript knowledge
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              A code editor (VS Code recommended)
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1: Create Project */}
        <Card className={currentStep === 1 ? "border-blue-300 dark:border-blue-700" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("step1")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {completedSteps.has(1) ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                )}
                <div>
                  <CardTitle>Create Project</CardTitle>
                  <CardDescription>Initialize a new Node.js project</CardDescription>
                </div>
              </div>
              {expandedSections.has("step1") ? (
                <ChevronDown className="h-5 w-5 text-zinc-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("step1") && (
            <CardContent className="pt-0">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Create a new directory and initialize a Node.js project:
              </p>

              <CodeBlock
                code={`mkdir my-mcp-server
cd my-mcp-server
npm init -y`}
                filename="Terminal"
              />

              <p className="text-zinc-600 dark:text-zinc-400 mt-4 mb-4">
                Update your <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">package.json</code> to use ES modules:
              </p>

              <CodeBlock code={codeBlocks.packageJson} filename="package.json" />

              <Tip>
                We use <code>&quot;type&quot;: &quot;module&quot;</code> to enable ES module imports,
                which is required by the MCP SDK.
              </Tip>

              <Button onClick={() => markComplete(1)} className="mt-4">
                Done - Continue to Step 2
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Step 2: Install Dependencies */}
        <Card className={currentStep === 2 ? "border-blue-300 dark:border-blue-700" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("step2")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {completedSteps.has(2) ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold
                    ${currentStep >= 2 ? "bg-blue-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}>
                    2
                  </div>
                )}
                <div>
                  <CardTitle>Install Dependencies</CardTitle>
                  <CardDescription>Add MCP SDK and Zod for validation</CardDescription>
                </div>
              </div>
              {expandedSections.has("step2") ? (
                <ChevronDown className="h-5 w-5 text-zinc-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("step2") && (
            <CardContent className="pt-0">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Install the MCP SDK and Zod (for input validation):
              </p>

              <CodeBlock
                code="npm install @modelcontextprotocol/sdk zod"
                filename="Terminal"
              />

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">@modelcontextprotocol/sdk</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                    The official MCP SDK. Provides McpServer class and transport layers.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">zod</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                    TypeScript-first schema validation. Used to define tool input schemas.
                  </CardContent>
                </Card>
              </div>

              <Button onClick={() => markComplete(2)} className="mt-4">
                Done - Continue to Step 3
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Step 3: Create Server */}
        <Card className={currentStep === 3 ? "border-blue-300 dark:border-blue-700" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("step3")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {completedSteps.has(3) ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold
                    ${currentStep >= 3 ? "bg-blue-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}>
                    3
                  </div>
                )}
                <div>
                  <CardTitle>Create Server</CardTitle>
                  <CardDescription>Write the basic server code</CardDescription>
                </div>
              </div>
              {expandedSections.has("step3") ? (
                <ChevronDown className="h-5 w-5 text-zinc-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("step3") && (
            <CardContent className="pt-0">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Create <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">index.js</code> with the basic server setup:
              </p>

              <CodeBlock code={codeBlocks.basicServer} filename="index.js" />

              <div className="mt-4 space-y-3">
                <h4 className="font-semibold">What&apos;s happening here:</h4>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">1.</span>
                    <span>Import McpServer and StdioServerTransport from the SDK</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">2.</span>
                    <span>Create a new server with a name and version</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">3.</span>
                    <span>Use stdio transport (communicates via stdin/stdout)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">4.</span>
                    <span>Connect the server to the transport</span>
                  </li>
                </ul>
              </div>

              <Tip>
                We use <code>console.error</code> for logging because <code>stdout</code> is
                reserved for MCP protocol messages.
              </Tip>

              <Button onClick={() => markComplete(3)} className="mt-4">
                Done - Continue to Step 4
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Step 4: Add a Tool */}
        <Card className={currentStep === 4 ? "border-blue-300 dark:border-blue-700" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("step4")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {completedSteps.has(4) ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold
                    ${currentStep >= 4 ? "bg-blue-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}>
                    4
                  </div>
                )}
                <div>
                  <CardTitle>Add a Tool</CardTitle>
                  <CardDescription>Define your first MCP tool</CardDescription>
                </div>
              </div>
              {expandedSections.has("step4") ? (
                <ChevronDown className="h-5 w-5 text-zinc-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("step4") && (
            <CardContent className="pt-0">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Now let&apos;s add a <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">greet</code> tool
                that says hello with different styles:
              </p>

              <CodeBlock code={codeBlocks.withTool} filename="index.js" />

              <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <h4 className="font-semibold mb-3">Tool Anatomy:</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex gap-2">
                    <span className="text-purple-500">server.tool(</span>
                  </div>
                  <div className="pl-4 flex gap-2">
                    <span className="text-green-500">&quot;greet&quot;</span>
                    <span className="text-zinc-500">{"// Tool name (unique identifier)"}</span>
                  </div>
                  <div className="pl-4 flex gap-2">
                    <span className="text-green-500">&quot;Description...&quot;</span>
                    <span className="text-zinc-500">{"// What the tool does"}</span>
                  </div>
                  <div className="pl-4 flex gap-2">
                    <span className="text-blue-500">{`{ name: z.string() }`}</span>
                    <span className="text-zinc-500">{"// Input schema (Zod)"}</span>
                  </div>
                  <div className="pl-4 flex gap-2">
                    <span className="text-orange-500">async (input) =&gt; result</span>
                    <span className="text-zinc-500">{"// Handler function"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-500">)</span>
                  </div>
                </div>
              </div>

              <Tip>
                The AI will see your tool description and schema. Write clear descriptions
                so it knows when and how to use your tool!
              </Tip>

              <Button onClick={() => markComplete(4)} className="mt-4">
                Done - Continue to Step 5
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Step 5: Test It */}
        <Card className={currentStep === 5 ? "border-blue-300 dark:border-blue-700" : ""}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("step5")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {completedSteps.has(5) ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold
                    ${currentStep >= 5 ? "bg-blue-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}>
                    5
                  </div>
                )}
                <div>
                  <CardTitle>Test It</CardTitle>
                  <CardDescription>Run and test your MCP server</CardDescription>
                </div>
              </div>
              {expandedSections.has("step5") ? (
                <ChevronDown className="h-5 w-5 text-zinc-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.has("step5") && (
            <CardContent className="pt-0">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                To use your server with Claude Desktop, add it to your config:
              </p>

              <div className="mb-4">
                <p className="text-sm text-zinc-500 mb-2">
                  Config location: <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </code> (macOS)
                </p>
              </div>

              <CodeBlock code={codeBlocks.claudeConfig} filename="claude_desktop_config.json" />

              <Warning>
                Replace <code>/path/to/your/project/</code> with the actual path to your project folder!
              </Warning>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Testing with Claude
                </h4>
                <ol className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <li>1. Save the config and restart Claude Desktop</li>
                  <li>2. Look for your server in the MCP menu (hammer icon)</li>
                  <li>3. Ask Claude: &quot;Use the greet tool to say hi to Alice in an excited way&quot;</li>
                </ol>
              </div>

              <Button onClick={() => markComplete(5)} className="mt-4">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Tutorial
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Completion */}
      {completedSteps.size === 5 && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                Congratulations!
              </h3>
            </div>
            <p className="text-green-700 dark:text-green-300 mb-4">
              You&apos;ve built your first MCP server! Here&apos;s what you learned:
            </p>
            <ul className="space-y-1 text-sm text-green-600 dark:text-green-400 mb-6">
              <li>✓ Setting up an MCP project with the SDK</li>
              <li>✓ Creating a server with stdio transport</li>
              <li>✓ Defining tools with Zod schemas</li>
              <li>✓ Configuring Claude Desktop to use your server</li>
            </ul>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/learn/mcp-tools">
                  Next: Creating MCP Tools
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/challenges/hello-world">
                  Try a Challenge
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/playground">
                  Open Playground
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bonus: Multiple Tools */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Bonus: Adding More Tools
          </CardTitle>
          <CardDescription>
            Expand your server with multiple tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Here&apos;s an example with three tools - a greeter, calculator, and random number generator:
          </p>
          <CodeBlock code={codeBlocks.withMultipleTools} filename="index.js (expanded)" />
        </CardContent>
      </Card>

      {/* Interactive Playground */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Try It Yourself
          </CardTitle>
          <CardDescription>
            Experiment with the code in our interactive playground
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Modify the code below and use the &quot;Test Tools&quot; tab to simulate tool calls:
          </p>
          <MCPPlayground
            initialCode={codeBlocks.withMultipleTools}
            height="450px"
            showToolTester={true}
            title="MCP Server Playground"
            description="Edit the code and test your tools"
          />
        </CardContent>
      </Card>
    </div>
  );
}
