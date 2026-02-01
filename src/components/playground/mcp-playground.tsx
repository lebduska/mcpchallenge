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
interface ExtractedParam {
  name: string;
  type: "string" | "number" | "boolean" | "enum";
  enumValues?: string[];
  description?: string;
  example?: string;
}

interface ExtractedTool {
  name: string;
  description: string;
  parameters: string[];
  paramDetails: ExtractedParam[];
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

  // Match server.tool(...) calls - get everything up to the async handler
  const toolRegex = /server\.tool\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}/g;
  let match;

  while ((match = toolRegex.exec(code)) !== null) {
    const [, name, description, paramsBlock] = match;

    // Extract parameter details from the schema
    const parameters: string[] = [];
    const paramDetails: ExtractedParam[] = [];

    // Match each parameter line: name: z.type().describe("...") etc.
    const paramLineRegex = /(\w+)\s*:\s*z\.(\w+)\((.*?)\)/g;
    let paramMatch;

    while ((paramMatch = paramLineRegex.exec(paramsBlock)) !== null) {
      const [, paramName, zodType, zodArgs] = paramMatch;
      parameters.push(paramName);

      const param: ExtractedParam = {
        name: paramName,
        type: zodType === "number" ? "number" : zodType === "boolean" ? "boolean" : zodType === "enum" ? "enum" : "string",
        example: "",
      };

      // Extract enum values
      if (zodType === "enum") {
        const enumMatch = zodArgs.match(/\[([^\]]+)\]/);
        if (enumMatch) {
          param.enumValues = enumMatch[1].split(",").map(v => v.trim().replace(/["']/g, ""));
          param.example = param.enumValues[0];
        }
      }

      // Extract description from .describe("...")
      const descMatch = paramsBlock.substring(paramsBlock.indexOf(paramName)).match(/\.describe\(["']([^"']+)["']\)/);
      if (descMatch) {
        param.description = descMatch[1];
      }

      // Generate example based on type and name
      if (!param.example) {
        param.example = generateExample(paramName, param.type, param.description);
      }

      paramDetails.push(param);
    }

    tools.push({ name, description, parameters, paramDetails });
  }

  return tools;
}

// Generate sensible example values based on parameter name and type
function generateExample(name: string, type: string, description?: string): string {
  const nameLower = name.toLowerCase();
  const descLower = (description || "").toLowerCase();

  // Number examples
  if (type === "number") {
    if (nameLower.includes("lat")) return "50.0875";
    if (nameLower.includes("long") || nameLower.includes("lng")) return "14.4213";
    if (nameLower.includes("port")) return "3000";
    if (nameLower.includes("min")) return "1";
    if (nameLower.includes("max")) return "100";
    if (nameLower.includes("position")) return "4";
    if (nameLower.includes("price")) return "19.99";
    if (nameLower.includes("qty") || nameLower.includes("quantity")) return "5";
    if (nameLower === "a") return "10";
    if (nameLower === "b") return "5";
    return "42";
  }

  // Boolean examples
  if (type === "boolean") {
    return "true";
  }

  // String examples based on common names
  if (nameLower.includes("name")) return "Alice";
  if (nameLower.includes("city")) return "Prague";
  if (nameLower.includes("path") || nameLower.includes("file")) return "/tmp/example.txt";
  if (nameLower.includes("dir")) return "/tmp";
  if (nameLower.includes("url")) return "https://example.com";
  if (nameLower.includes("email")) return "user@example.com";
  if (nameLower.includes("title")) return "My Note";
  if (nameLower.includes("content") || nameLower.includes("text") || nameLower.includes("message")) return "Hello, World!";
  if (nameLower.includes("pattern") || nameLower.includes("query") || nameLower.includes("search")) return "TODO";
  if (nameLower.includes("key")) return "myKey";
  if (nameLower.includes("value")) return "myValue";
  if (nameLower.includes("id")) return "item-1";
  if (nameLower.includes("json")) return '{"name": "test", "value": 123}';
  if (nameLower.includes("csv")) return "name,price,qty\\nApple,1.5,10\\nBanana,0.75,20";
  if (nameLower.includes("field")) return "name";
  if (nameLower.includes("expression")) return "{ name: item.name }";
  if (nameLower.includes("format")) return "json";
  if (nameLower.includes("order")) return "asc";
  if (nameLower.includes("operator")) return "eq";

  // Default
  return "example";
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

  // Configure Monaco with type stubs for MCP SDK
  const handleEditorWillMount = (monaco: Monaco) => {
    // Add type definitions for MCP SDK, Zod, and WebSocket
    const mcpTypes = `
      declare module "@modelcontextprotocol/sdk/server/mcp.js" {
        export interface McpServerOptions {
          name: string;
          version: string;
        }
        export interface ToolResult {
          content: Array<{ type: string; text: string }>;
        }
        export class McpServer {
          constructor(options: McpServerOptions);
          tool<T extends Record<string, any>>(
            name: string,
            description: string,
            schema: T,
            handler: (input: any) => Promise<ToolResult>
          ): void;
          connect(transport: any): Promise<void>;
        }
      }

      declare module "@modelcontextprotocol/sdk/server/stdio.js" {
        export class StdioServerTransport {
          constructor();
        }
      }

      declare module "@modelcontextprotocol/sdk/server/websocket.js" {
        export class WebSocketServerTransport {
          constructor(ws: any);
        }
      }

      declare module "@modelcontextprotocol/sdk/server/http-sse.js" {
        export class HttpSseServerTransport {
          constructor();
          handleRequest(body: any): Promise<any>;
        }
      }

      declare module "ws" {
        export class WebSocketServer {
          constructor(options: { port: number });
          on(event: "connection", callback: (ws: WebSocket) => void): void;
        }
        export interface WebSocket {
          on(event: string, callback: (...args: any[]) => void): void;
          send(data: string): void;
        }
      }

      declare module "express" {
        interface Request {
          body: any;
        }
        interface Response {
          json(data: any): void;
          setHeader(name: string, value: string): void;
          write(data: string): void;
        }
        interface Express {
          post(path: string, ...handlers: any[]): void;
          get(path: string, handler: (req: Request, res: Response) => void): void;
          listen(port: number, callback?: () => void): void;
        }
        function express(): Express;
        namespace express {
          function json(): any;
        }
        export = express;
      }

      declare module "zod" {
        interface ZodString {
          describe(description: string): ZodString;
          optional(): ZodString;
          default(value: string): ZodString;
          min(n: number): ZodString;
          max(n: number): ZodString;
        }
        interface ZodNumber {
          describe(description: string): ZodNumber;
          optional(): ZodNumber;
          default(value: number): ZodNumber;
          min(n: number): ZodNumber;
          max(n: number): ZodNumber;
        }
        interface ZodEnum<T> {
          describe(description: string): ZodEnum<T>;
          optional(): ZodEnum<T>;
        }
        interface ZodBoolean {
          describe(description: string): ZodBoolean;
          optional(): ZodBoolean;
          default(value: boolean): ZodBoolean;
        }
        export const z: {
          string(): ZodString;
          number(): ZodNumber;
          boolean(): ZodBoolean;
          enum<T extends readonly string[]>(values: T): ZodEnum<T[number]>;
          object<T>(shape: T): any;
          array<T>(schema: T): any;
        };
      }
    `;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(mcpTypes, "mcp-types.d.ts");

    // Enable semantic validation
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Compiler options that properly support type aliases and modern TS features
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      esModuleInterop: true,
      allowJs: true,
      checkJs: false, // Don't check JS, only TS
      strict: false, // More lenient type checking
      noImplicitAny: false,
      strictNullChecks: false,
      skipLibCheck: true,
      lib: ["esnext", "dom"],
      jsx: monaco.languages.typescript.JsxEmit.React,
    });

    // Set eager model sync for better type inference
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
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
                            // Pre-fill with example values
                            const examples: Record<string, string> = {};
                            tool.paramDetails.forEach((p) => {
                              if (p.example) examples[p.name] = p.example;
                            });
                            setToolInput(examples);
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
                      {currentTool.paramDetails.map((param) => (
                        <div key={param.name}>
                          <label className="text-xs text-zinc-500 block mb-1">
                            {param.name}
                            {param.description && (
                              <span className="text-zinc-400 ml-1">- {param.description}</span>
                            )}
                          </label>
                          {param.type === "enum" && param.enumValues ? (
                            <select
                              value={toolInput[param.name] || param.example || ""}
                              onChange={(e) =>
                                setToolInput({ ...toolInput, [param.name]: e.target.value })
                              }
                              className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-zinc-900"
                            >
                              {param.enumValues.map((val) => (
                                <option key={val} value={val}>{val}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={param.type === "number" ? "number" : "text"}
                              value={toolInput[param.name] ?? param.example ?? ""}
                              onChange={(e) =>
                                setToolInput({ ...toolInput, [param.name]: e.target.value })
                              }
                              placeholder={param.example || `Enter ${param.name}...`}
                              className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-zinc-900"
                            />
                          )}
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
