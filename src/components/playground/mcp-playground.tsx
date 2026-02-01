"use client";

import { useState, useCallback } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Zap,
  FileCode,
  ChevronRight,
  Send,
} from "lucide-react";

// Tool definition extracted from code
interface ExtractedTool {
  name: string;
  description: string;
  parameters: string[];
}

interface ToolCallResult {
  tool: string;
  input: Record<string, unknown>;
  output: string;
  success: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  tools: ExtractedTool[];
}

interface MCPPlaygroundProps {
  initialCode?: string;
  height?: string;
  showToolTester?: boolean;
  title?: string;
  description?: string;
  readOnly?: boolean;
  compact?: boolean;
}

const DEFAULT_CODE = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-playground-server",
  version: "1.0.0",
});

// 🎯 Tool 1: Greeting
server.tool(
  "greet",
  "Say hello to someone with a personalized message",
  {
    name: z.string().describe("Name of the person"),
    style: z.enum(["formal", "casual", "excited"]).optional(),
  },
  async ({ name, style = "casual" }) => {
    const greetings = {
      formal: \`Good day, \${name}. It is a pleasure to meet you.\`,
      casual: \`Hey \${name}! What's up?\`,
      excited: \`OMG HI \${name}!!! 🎉\`,
    };
    return {
      content: [{ type: "text", text: greetings[style] }],
    };
  }
);

// 🧮 Tool 2: Calculator
server.tool(
  "calculate",
  "Perform basic math operations",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number(),
    b: z.number(),
  },
  async ({ operation, a, b }) => {
    const ops = {
      add: a + b,
      subtract: a - b,
      multiply: a * b,
      divide: b !== 0 ? a / b : NaN,
    };
    return {
      content: [{ type: "text", text: \`Result: \${ops[operation]}\` }],
    };
  }
);

// 🎲 Tool 3: Random
server.tool(
  "random",
  "Generate a random number in range",
  {
    min: z.number().default(1),
    max: z.number().default(100),
  },
  async ({ min, max }) => {
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    return {
      content: [{ type: "text", text: \`Random: \${result}\` }],
    };
  }
);

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);
`;

// Simulate tool execution based on extracted tool info
function simulateToolCall(
  toolName: string,
  input: Record<string, unknown>,
  code: string
): { output: string; success: boolean } {
  try {
    // Simple simulation based on common patterns
    if (toolName === "greet") {
      const name = input.name as string || "World";
      const style = input.style as string || "casual";
      const greetings: Record<string, string> = {
        formal: `Good day, ${name}. It is a pleasure to meet you.`,
        casual: `Hey ${name}! What's up?`,
        excited: `OMG HI ${name}!!! 🎉`,
      };
      return { output: greetings[style] || greetings.casual, success: true };
    }

    if (toolName === "calculate") {
      const a = Number(input.a) || 0;
      const b = Number(input.b) || 0;
      const op = input.operation as string;
      const ops: Record<string, number> = {
        add: a + b,
        subtract: a - b,
        multiply: a * b,
        divide: b !== 0 ? a / b : NaN,
      };
      return { output: `Result: ${ops[op] ?? "Unknown operation"}`, success: true };
    }

    if (toolName === "random") {
      const min = Number(input.min) || 1;
      const max = Number(input.max) || 100;
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      return { output: `Random: ${result}`, success: true };
    }

    // Generic response for custom tools
    return {
      output: `Tool "${toolName}" called with: ${JSON.stringify(input)}`,
      success: true,
    };
  } catch (error) {
    return { output: `Error: ${(error as Error).message}`, success: false };
  }
}

// Extract tools from code using regex
function extractTools(code: string): ExtractedTool[] {
  const tools: ExtractedTool[] = [];

  // Match server.tool(...) calls
  const toolRegex = /server\.tool\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}/g;
  let match;

  while ((match = toolRegex.exec(code)) !== null) {
    const [, name, description, paramsBlock] = match;

    // Extract parameter names from the schema
    const paramRegex = /(\w+)\s*:/g;
    const parameters: string[] = [];
    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramsBlock)) !== null) {
      parameters.push(paramMatch[1]);
    }

    tools.push({ name, description, parameters });
  }

  return tools;
}

// Validate MCP code
function validateCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required imports
  if (!code.includes("McpServer")) {
    errors.push("Missing McpServer import");
  }

  if (!code.includes("server.tool")) {
    warnings.push("No tools defined - your server won't do much!");
  }

  // Check for common issues
  if (code.includes("console.log") && !code.includes("console.error")) {
    warnings.push("Use console.error for logging (stdout is reserved for MCP)");
  }

  // Check for server creation
  if (!code.includes("new McpServer")) {
    errors.push("Missing server instantiation (new McpServer)");
  }

  // Check for transport
  if (!code.includes("transport") && !code.includes("Transport")) {
    warnings.push("No transport configured - server won't be able to communicate");
  }

  // Extract tools
  const tools = extractTools(code);

  // Check tool definitions
  tools.forEach((tool) => {
    if (!tool.description || tool.description.length < 5) {
      warnings.push(`Tool "${tool.name}" has a short description - AI may not understand it well`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tools,
  };
}

export function MCPPlayground({
  initialCode = DEFAULT_CODE,
  height = "400px",
  showToolTester = true,
  title,
  description,
  readOnly = false,
  compact = false,
}: MCPPlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("code");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolInput, setToolInput] = useState<Record<string, string>>({});
  const [toolResults, setToolResults] = useState<ToolCallResult[]>([]);

  const handleValidate = useCallback(() => {
    setIsValidating(true);

    // Simulate async validation
    setTimeout(() => {
      const result = validateCode(code);
      setValidation(result);
      setIsValidating(false);

      if (result.tools.length > 0 && !selectedTool) {
        setSelectedTool(result.tools[0].name);
      }
    }, 500);
  }, [code, selectedTool]);

  const handleReset = () => {
    setCode(initialCode);
    setValidation(null);
    setToolResults([]);
    setToolInput({});
  };

  const handleToolCall = () => {
    if (!selectedTool) return;

    const parsedInput: Record<string, unknown> = {};
    Object.entries(toolInput).forEach(([key, value]) => {
      // Try to parse as number or keep as string
      const num = Number(value);
      parsedInput[key] = isNaN(num) ? value : num;
    });

    const { output, success } = simulateToolCall(selectedTool, parsedInput, code);

    setToolResults([
      {
        tool: selectedTool,
        input: parsedInput,
        output,
        success,
      },
      ...toolResults.slice(0, 9), // Keep last 10 results
    ]);
  };

  const currentTool = validation?.tools.find((t) => t.name === selectedTool);

  // Configure Monaco: keep syntax validation, disable semantic (types/modules)
  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,  // Disable type errors (Record, imports, etc.)
      noSyntaxValidation: false,   // Keep syntax errors (missing brackets, etc.)
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
  };

  return (
    <Card className={compact ? "border-0 shadow-none" : ""}>
      {(title || description) && !compact && (
        <CardHeader className="pb-2">
          {title && <CardTitle>{title}</CardTitle>}
          {description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className={compact ? "p-0" : "pt-2"}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="code" className="gap-2">
                <FileCode className="h-4 w-4" />
                Code
              </TabsTrigger>
              {showToolTester && (
                <TabsTrigger value="test" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Test Tools
                </TabsTrigger>
              )}
              <TabsTrigger value="output" className="gap-2">
                <Terminal className="h-4 w-4" />
                Output
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleValidate} disabled={isValidating}>
                {isValidating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Validate
              </Button>
            </div>
          </div>

          <TabsContent value="code" className="mt-0">
            <div className="border rounded-lg overflow-hidden">
              <Editor
                height={height}
                defaultLanguage="typescript"
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-dark"
                beforeMount={handleEditorWillMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  readOnly,
                  padding: { top: 16 },
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="test" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: height }}>
              {/* Tool Selector & Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Tool</label>
                  {validation?.tools.length ? (
                    <div className="flex flex-wrap gap-2">
                      {validation.tools.map((tool) => (
                        <Button
                          key={tool.name}
                          variant={selectedTool === tool.name ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedTool(tool.name);
                            setToolInput({});
                          }}
                        >
                          {tool.name}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Click &quot;Validate&quot; first to discover tools
                    </p>
                  )}
                </div>

                {currentTool && (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {currentTool.description}
                    </p>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Parameters</label>
                      {currentTool.parameters.map((param) => (
                        <div key={param}>
                          <label className="text-xs text-zinc-500 block mb-1">{param}</label>
                          <input
                            type="text"
                            value={toolInput[param] || ""}
                            onChange={(e) =>
                              setToolInput({ ...toolInput, [param]: e.target.value })
                            }
                            placeholder={`Enter ${param}...`}
                            className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-zinc-900"
                          />
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleToolCall} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Call {selectedTool}
                    </Button>
                  </div>
                )}
              </div>

              {/* Results */}
              <div>
                <label className="text-sm font-medium mb-2 block">Results</label>
                <div
                  className="space-y-2 overflow-y-auto border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900"
                  style={{ height: `calc(${height} - 40px)` }}
                >
                  {toolResults.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-8">
                      Call a tool to see results here
                    </p>
                  ) : (
                    toolResults.map((result, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg text-sm ${
                          result.success
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {result.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-mono font-medium">{result.tool}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mb-1">
                          Input: {JSON.stringify(result.input)}
                        </div>
                        <div className="font-mono">{result.output}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="output" className="mt-0">
            <div
              className="border rounded-lg p-4 bg-zinc-900 text-zinc-100 font-mono text-sm overflow-y-auto"
              style={{ height }}
            >
              {!validation ? (
                <span className="text-zinc-500">Click &quot;Validate&quot; to check your code...</span>
              ) : (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {validation.valid ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <span className="text-green-400">Server code is valid!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-400" />
                        <span className="text-red-400">Found issues in your code</span>
                      </>
                    )}
                  </div>

                  {/* Errors */}
                  {validation.errors.length > 0 && (
                    <div>
                      <div className="text-red-400 mb-1">Errors:</div>
                      {validation.errors.map((error, i) => (
                        <div key={i} className="text-red-300 pl-4">
                          <ChevronRight className="h-3 w-3 inline mr-1" />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {validation.warnings.length > 0 && (
                    <div>
                      <div className="text-yellow-400 mb-1">Warnings:</div>
                      {validation.warnings.map((warning, i) => (
                        <div key={i} className="text-yellow-300 pl-4">
                          <ChevronRight className="h-3 w-3 inline mr-1" />
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tools Found */}
                  {validation.tools.length > 0 && (
                    <div>
                      <div className="text-blue-400 mb-1">
                        Tools discovered ({validation.tools.length}):
                      </div>
                      {validation.tools.map((tool, i) => (
                        <div key={i} className="pl-4 py-1">
                          <span className="text-green-300">{tool.name}</span>
                          <span className="text-zinc-500"> - {tool.description}</span>
                          {tool.parameters.length > 0 && (
                            <div className="text-zinc-600 text-xs pl-4">
                              params: {tool.parameters.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {validation.valid && (
                    <div className="text-green-400 pt-2 border-t border-zinc-700">
                      ✨ Your MCP server is ready to use!
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Export a smaller embeddable version for tutorials
export function MCPPlaygroundEmbed({
  code,
  height = "300px",
}: {
  code: string;
  height?: string;
}) {
  return (
    <MCPPlayground
      initialCode={code}
      height={height}
      showToolTester={false}
      compact={true}
      readOnly={false}
    />
  );
}
