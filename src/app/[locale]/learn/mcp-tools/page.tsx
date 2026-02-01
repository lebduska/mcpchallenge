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
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  FileCode,
  Wrench,
  Shield,
  Code,
} from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, title: "Tool Definition", description: "Learn how to define tools with server.tool()" },
  { id: 2, title: "Zod Schemas", description: "Use Zod for parameter validation" },
  { id: 3, title: "Error Handling", description: "Handle errors and edge cases properly" },
];

const codeBlocks = {
  basicTool: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "tools-demo",
  version: "1.0.0",
});

// Basic tool definition
server.tool(
  "capitalize",                              // 1. Tool name (unique identifier)
  "Capitalize the first letter of a string", // 2. Description for AI
  { text: z.string() },                      // 3. Input schema using Zod
  async ({ text }) => {                      // 4. Handler function
    const result = text.charAt(0).toUpperCase() + text.slice(1);
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`,

  zodSchemas: `import { z } from "zod";

// Simple types
server.tool(
  "simple-types",
  "Demonstrates simple Zod types",
  {
    name: z.string(),                    // Required string
    age: z.number(),                     // Required number
    isActive: z.boolean(),               // Required boolean
    tags: z.array(z.string()),           // Array of strings
  },
  async (params) => ({ /* ... */ })
);

// Optional and default values
server.tool(
  "optional-params",
  "Shows optional and default parameters",
  {
    message: z.string(),
    level: z.enum(["info", "warning", "error"]).default("info"),
    timestamp: z.boolean().optional(),
    metadata: z.record(z.string()).optional(),
  },
  async ({ message, level = "info", timestamp, metadata }) => {
    // level will be "info" if not provided
    // timestamp and metadata might be undefined
    return { /* ... */ };
  }
);

// Complex schemas
server.tool(
  "create-user",
  "Create a user with validation",
  {
    email: z.string().email(),           // Must be valid email
    age: z.number().min(18).max(120),    // Age constraints
    username: z.string().min(3).max(20), // Length constraints
    role: z.enum(["user", "admin", "guest"]),
    preferences: z.object({              // Nested object
      theme: z.enum(["light", "dark"]),
      notifications: z.boolean(),
    }).optional(),
  },
  async (params) => ({ /* ... */ })
);

// Using describe() for better AI understanding
server.tool(
  "search",
  "Search for items in the database",
  {
    query: z.string().describe("The search query string"),
    limit: z.number().min(1).max(100).default(10)
      .describe("Maximum number of results to return"),
    sortBy: z.enum(["relevance", "date", "popularity"]).optional()
      .describe("Field to sort results by"),
  },
  async (params) => ({ /* ... */ })
);`,

  errorHandling: `import { z } from "zod";

// Error handling with isError flag
server.tool(
  "divide",
  "Divide two numbers safely",
  {
    numerator: z.number(),
    denominator: z.number(),
  },
  async ({ numerator, denominator }) => {
    // Check for edge cases
    if (denominator === 0) {
      return {
        isError: true,  // Mark as error
        content: [{
          type: "text",
          text: "Error: Cannot divide by zero"
        }],
      };
    }

    const result = numerator / denominator;
    return {
      content: [{
        type: "text",
        text: \`Result: \${result}\`
      }],
    };
  }
);

// Handling API errors
server.tool(
  "fetch-user",
  "Fetch user data from an API",
  {
    userId: z.string(),
  },
  async ({ userId }) => {
    try {
      const response = await fetch(\`https://api.example.com/users/\${userId}\`);

      if (!response.ok) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: \`HTTP Error: \${response.status} - \${response.statusText}\`
          }],
        };
      }

      const user = await response.json();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(user, null, 2)
        }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: \`Network error: \${error instanceof Error ? error.message : 'Unknown error'}\`
        }],
      };
    }
  }
);

// Validation with helpful error messages
server.tool(
  "create-event",
  "Create a calendar event",
  {
    title: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
  },
  async ({ title, startDate, endDate }) => {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Invalid start date format. Use ISO format (e.g., 2024-01-15T10:00:00Z)"
        }],
      };
    }

    if (isNaN(end.getTime())) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Invalid end date format. Use ISO format (e.g., 2024-01-15T11:00:00Z)"
        }],
      };
    }

    if (end <= start) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "End date must be after start date"
        }],
      };
    }

    // Success case
    return {
      content: [{
        type: "text",
        text: \`Event "\${title}" created from \${start.toISOString()} to \${end.toISOString()}\`
      }],
    };
  }
);`,

  bestPractices: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "best-practices-demo",
  version: "1.0.0",
});

// ✅ Good: Clear names and descriptions
server.tool(
  "calculate-mortgage-payment",
  "Calculate monthly mortgage payment based on loan amount, interest rate, and term",
  {
    loanAmount: z.number().min(0)
      .describe("Total loan amount in dollars"),
    annualInterestRate: z.number().min(0).max(100)
      .describe("Annual interest rate as a percentage (e.g., 5.5 for 5.5%)"),
    termYears: z.number().min(1).max(50)
      .describe("Loan term in years"),
  },
  async ({ loanAmount, annualInterestRate, termYears }) => {
    // Validate inputs
    if (loanAmount <= 0) {
      return {
        isError: true,
        content: [{ type: "text", text: "Loan amount must be greater than 0" }],
      };
    }

    // Calculate
    const monthlyRate = annualInterestRate / 100 / 12;
    const numPayments = termYears * 12;

    if (monthlyRate === 0) {
      // Special case: 0% interest
      const payment = loanAmount / numPayments;
      return {
        content: [{
          type: "text",
          text: \`Monthly payment: $\${payment.toFixed(2)}\`
        }],
      };
    }

    const payment = loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    return {
      content: [{
        type: "text",
        text: \`Monthly payment: $\${payment.toFixed(2)} over \${termYears} years\`
      }],
    };
  }
);

// ✅ Good: Multiple content types
server.tool(
  "analyze-data",
  "Analyze data and return summary statistics",
  {
    numbers: z.array(z.number()).min(1),
  },
  async ({ numbers }) => {
    if (numbers.length === 0) {
      return {
        isError: true,
        content: [{ type: "text", text: "Array cannot be empty" }],
      };
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      content: [
        {
          type: "text",
          text: \`Analysis of \${numbers.length} numbers:\`
        },
        {
          type: "text",
          text: \`Mean: \${mean.toFixed(2)}\`
        },
        {
          type: "text",
          text: \`Median: \${median}\`
        },
        {
          type: "text",
          text: \`Min: \${sorted[0]}\`
        },
        {
          type: "text",
          text: \`Max: \${sorted[sorted.length - 1]}\`
        },
      ],
    };
  }
);

// ✅ Good: Proper async handling
server.tool(
  "fetch-weather",
  "Fetch current weather for a city",
  {
    city: z.string().min(1).describe("City name"),
    country: z.string().length(2).optional()
      .describe("2-letter country code (e.g., US, UK)"),
  },
  async ({ city, country }) => {
    try {
      const location = country ? \`\${city},\${country}\` : city;
      const response = await fetch(
        \`https://api.example.com/weather?q=\${encodeURIComponent(location)}\`
      );

      if (!response.ok) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: \`Failed to fetch weather: \${response.statusText}\`
          }],
        };
      }

      const data = await response.json();
      return {
        content: [{
          type: "text",
          text: \`Weather in \${city}: \${data.temperature}°C, \${data.condition}\`
        }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`
        }],
      };
    }
  }
);`,

  playgroundExample: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "tools-playground",
  version: "1.0.0",
});

// Tool 1: String manipulation with validation
server.tool(
  "reverse-string",
  "Reverse a string with optional uppercase conversion",
  {
    text: z.string().min(1).describe("The text to reverse"),
    uppercase: z.boolean().default(false)
      .describe("Whether to convert to uppercase"),
  },
  async ({ text, uppercase = false }) => {
    if (text.length === 0) {
      return {
        isError: true,
        content: [{ type: "text", text: "Text cannot be empty" }],
      };
    }

    let result = text.split('').reverse().join('');
    if (uppercase) {
      result = result.toUpperCase();
    }

    return {
      content: [{ type: "text", text: result }],
    };
  }
);

// Tool 2: Math with error handling
server.tool(
  "calculate",
  "Perform safe mathematical operations",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide", "power"]),
    a: z.number(),
    b: z.number(),
  },
  async ({ operation, a, b }) => {
    let result: number;

    try {
      switch (operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          if (b === 0) {
            return {
              isError: true,
              content: [{ type: "text", text: "Cannot divide by zero" }],
            };
          }
          result = a / b;
          break;
        case "power":
          result = Math.pow(a, b);
          if (!isFinite(result)) {
            return {
              isError: true,
              content: [{ type: "text", text: "Result is too large" }],
            };
          }
          break;
        default:
          return {
            isError: true,
            content: [{ type: "text", text: "Unknown operation" }],
          };
      }

      return {
        content: [{
          type: "text",
          text: \`\${a} \${operation} \${b} = \${result}\`
        }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: \`Calculation error: \${error instanceof Error ? error.message : 'Unknown'}\`
        }],
      };
    }
  }
);

// Tool 3: Data validation example
server.tool(
  "validate-email",
  "Validate and normalize email addresses",
  {
    email: z.string().email().describe("Email address to validate"),
  },
  async ({ email }) => {
    // Additional custom validation
    const normalized = email.toLowerCase().trim();
    const parts = normalized.split('@');

    if (parts.length !== 2) {
      return {
        isError: true,
        content: [{ type: "text", text: "Invalid email format" }],
      };
    }

    const [localPart, domain] = parts;

    if (localPart.length === 0 || domain.length === 0) {
      return {
        isError: true,
        content: [{ type: "text", text: "Email has empty local part or domain" }],
      };
    }

    return {
      content: [{
        type: "text",
        text: \`Valid email: \${normalized}\nLocal part: \${localPart}\nDomain: \${domain}\`
      }],
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

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg my-4">
      <Code className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-blue-800 dark:text-blue-200">{children}</div>
    </div>
  );
}

export default function MCPToolsPage() {
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
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            intermediate
          </Badge>
          <Badge variant="secondary">20 min</Badge>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Creating MCP Tools
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Learn how to define powerful MCP tools with proper validation and error handling.
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
              Complete the &quot;Your First MCP Server&quot; tutorial
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Basic understanding of TypeScript/JavaScript
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Familiarity with async/await
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1: Tool Definition */}
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
                  <CardTitle>Tool Definition</CardTitle>
                  <CardDescription>How to define tools with server.tool()</CardDescription>
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
                MCP tools are defined using the <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">server.tool()</code> method.
                Each tool consists of four key components:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      1. Tool Name
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                    Unique identifier for the tool. Use kebab-case or camelCase.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      2. Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                    Clear explanation of what the tool does. The AI uses this to decide when to call it.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      3. Input Schema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                    Zod schema defining the tool&apos;s parameters and validation rules.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      4. Handler Function
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                    Async function that executes the tool&apos;s logic and returns results.
                  </CardContent>
                </Card>
              </div>

              <CodeBlock code={codeBlocks.basicTool} filename="index.js" />

              <InfoBox>
                <strong>Tool Response Format:</strong> All tools must return an object with a <code>content</code> array.
                Each content item must have a <code>type</code> (usually &quot;text&quot;) and the corresponding data.
              </InfoBox>

              <Tip>
                Write descriptive tool names and descriptions! The AI model reads these to understand when
                and how to use your tool. Clear descriptions lead to better AI interactions.
              </Tip>

              <Button onClick={() => markComplete(1)} className="mt-4">
                Done - Continue to Step 2
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Step 2: Zod Schemas */}
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
                  <CardTitle>Zod Schemas</CardTitle>
                  <CardDescription>Use Zod for powerful parameter validation</CardDescription>
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
                Zod is a TypeScript-first schema validation library that MCP uses to validate tool inputs.
                It provides type safety and runtime validation.
              </p>

              <CodeBlock code={codeBlocks.zodSchemas} filename="zod-examples.js" />

              <div className="mt-4 space-y-3">
                <h4 className="font-semibold">Common Zod Schema Patterns:</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <code className="text-purple-600 dark:text-purple-400">z.string()</code> - Any string value
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <code className="text-purple-600 dark:text-purple-400">z.number().min(0).max(100)</code> - Number with constraints
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <code className="text-purple-600 dark:text-purple-400">z.enum([&quot;a&quot;, &quot;b&quot;, &quot;c&quot;])</code> - One of specific values
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <code className="text-purple-600 dark:text-purple-400">z.array(z.string())</code> - Array of strings
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <code className="text-purple-600 dark:text-purple-400">z.object(&#123; ... &#125;)</code> - Nested object
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <code className="text-purple-600 dark:text-purple-400">.optional()</code> - Makes parameter optional
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <code className="text-purple-600 dark:text-purple-400">.default(value)</code> - Provides default value
                  </div>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <code className="text-purple-600 dark:text-purple-400">.describe(&quot;text&quot;)</code> - Adds description for AI
                  </div>
                </div>
              </div>

              <Tip>
                Use <code>.describe()</code> on your Zod schemas! These descriptions help the AI understand
                what each parameter is for, leading to more accurate tool calls.
              </Tip>

              <InfoBox>
                <strong>Type Safety:</strong> When using TypeScript, Zod schemas automatically provide type
                inference, giving you autocomplete and type checking in your handler functions.
              </InfoBox>

              <Button onClick={() => markComplete(2)} className="mt-4">
                Done - Continue to Step 3
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Step 3: Error Handling */}
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
                  <CardTitle>Error Handling</CardTitle>
                  <CardDescription>Handle errors and edge cases properly</CardDescription>
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
                Proper error handling is crucial for reliable MCP tools. When errors occur, return an object
                with <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">isError: true</code> and
                a descriptive error message.
              </p>

              <CodeBlock code={codeBlocks.errorHandling} filename="error-handling.js" />

              <div className="mt-4 space-y-3">
                <h4 className="font-semibold">Error Handling Best Practices:</h4>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">1.</span>
                    <span><strong>Check edge cases</strong> - Validate inputs beyond Zod schema (e.g., divide by zero)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">2.</span>
                    <span><strong>Use try-catch</strong> - Wrap async operations and external API calls</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">3.</span>
                    <span><strong>Return isError: true</strong> - Signal errors to the MCP client</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">4.</span>
                    <span><strong>Provide clear messages</strong> - Help users understand what went wrong</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-mono">5.</span>
                    <span><strong>Handle network errors</strong> - Account for timeouts and connectivity issues</span>
                  </li>
                </ul>
              </div>

              <Warning>
                Never let exceptions bubble up unhandled! Always catch errors and return a proper error
                response with <code>isError: true</code>. Uncaught exceptions can crash your MCP server.
              </Warning>

              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Error Response Structure
                </h4>
                <pre className="text-sm text-green-700 dark:text-green-300 overflow-x-auto">
{`{
  isError: true,
  content: [{
    type: "text",
    text: "Clear error message here"
  }]
}`}
                </pre>
              </div>

              <Button onClick={() => markComplete(3)} className="mt-4">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Tutorial
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Completion */}
      {completedSteps.size === 3 && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                Excellent Work!
              </h3>
            </div>
            <p className="text-green-700 dark:text-green-300 mb-4">
              You&apos;ve mastered creating MCP tools! Here&apos;s what you learned:
            </p>
            <ul className="space-y-1 text-sm text-green-600 dark:text-green-400 mb-6">
              <li>✓ Defining tools with server.tool() and four key components</li>
              <li>✓ Using Zod schemas for parameter validation</li>
              <li>✓ Handling errors with isError flag and try-catch blocks</li>
              <li>✓ Best practices for clear descriptions and edge cases</li>
            </ul>
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
      )}

      {/* Best Practices */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Best Practices & Advanced Patterns
          </CardTitle>
          <CardDescription>
            Real-world examples showing best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Here are some well-designed tools demonstrating best practices:
          </p>
          <CodeBlock code={codeBlocks.bestPractices} filename="best-practices.js" />
        </CardContent>
      </Card>

      {/* Interactive Playground */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Interactive Playground
          </CardTitle>
          <CardDescription>
            Try the code in our playground instead of setting up locally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Experiment with these tools in the interactive playground. Try different inputs and see
            how the validation and error handling works:
          </p>
          <MCPPlayground
            initialCode={codeBlocks.playgroundExample}
            height="500px"
            showToolTester={true}
            title="MCP Tools Playground"
            description="Test the tools with different inputs to see validation and error handling in action"
          />
          <Tip>
            <strong>Try these tests in the playground:</strong>
            <ul className="mt-2 space-y-1">
              <li>• Test reverse-string with empty text to see error handling</li>
              <li>• Try calculate with divide by zero</li>
              <li>• Use power operation with very large numbers</li>
              <li>• Validate different email formats</li>
            </ul>
          </Tip>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-500" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Tool Definition Structure</h4>
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-sm overflow-x-auto">
                <pre>{`server.tool(
  "tool-name",           // Unique identifier
  "Description",         // What it does
  { /* Zod schema */ },  // Input validation
  async (params) => {    // Handler function
    return {
      content: [{ type: "text", text: "result" }]
    };
  }
);`}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Error Response</h4>
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-sm overflow-x-auto">
                <pre>{`return {
  isError: true,
  content: [{ type: "text", text: "Error message" }]
};`}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Success Response</h4>
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-sm overflow-x-auto">
                <pre>{`return {
  content: [
    { type: "text", text: "Result text" },
    // Can include multiple content items
  ]
};`}</pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
