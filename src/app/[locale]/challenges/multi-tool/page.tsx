"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Boxes, CheckCircle2, Lightbulb } from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";

const multiToolCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "multi-tool-server",
  version: "1.0.0",
});

// In-memory data store
const store: Record<string, any> = {};
const notes: Array<{ id: string; title: string; content: string; createdAt: Date }> = [];
let noteCounter = 0;

// === Data Store Tools ===

server.tool(
  "store_set",
  "Store a value with a key",
  {
    key: z.string().describe("Storage key"),
    value: z.any().describe("Value to store"),
  },
  async ({ key, value }) => {
    store[key] = value;
    return {
      content: [{ type: "text", text: \`Stored "\${key}" = \${JSON.stringify(value)}\` }],
    };
  }
);

server.tool(
  "store_get",
  "Retrieve a value by key",
  {
    key: z.string().describe("Storage key"),
  },
  async ({ key }) => {
    if (!(key in store)) {
      return {
        content: [{ type: "text", text: \`Key "\${key}" not found\` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(store[key], null, 2) }],
    };
  }
);

server.tool(
  "store_list",
  "List all stored keys",
  {},
  async () => ({
    content: [{
      type: "text",
      text: Object.keys(store).length > 0
        ? \`Stored keys: \${Object.keys(store).join(", ")}\`
        : "Store is empty",
    }],
  })
);

// === Notes Tools ===

server.tool(
  "note_create",
  "Create a new note",
  {
    title: z.string().describe("Note title"),
    content: z.string().describe("Note content"),
  },
  async ({ title, content }) => {
    const id = \`note-\${++noteCounter}\`;
    notes.push({ id, title, content, createdAt: new Date() });
    return {
      content: [{ type: "text", text: \`Created note "\${title}" with ID: \${id}\` }],
    };
  }
);

server.tool(
  "note_list",
  "List all notes",
  {},
  async () => {
    if (notes.length === 0) {
      return { content: [{ type: "text", text: "No notes yet" }] };
    }
    const list = notes.map(n => \`[\${n.id}] \${n.title}\`).join("\\n");
    return { content: [{ type: "text", text: list }] };
  }
);

server.tool(
  "note_read",
  "Read a note by ID",
  {
    id: z.string().describe("Note ID"),
  },
  async ({ id }) => {
    const note = notes.find(n => n.id === id);
    if (!note) {
      return { content: [{ type: "text", text: \`Note \${id} not found\` }], isError: true };
    }
    return {
      content: [{
        type: "text",
        text: \`# \${note.title}\\n\\n\${note.content}\\n\\nCreated: \${note.createdAt.toISOString()}\`,
      }],
    };
  }
);

// === Utility Tools ===

server.tool(
  "uuid",
  "Generate a random UUID",
  {},
  async () => ({
    content: [{ type: "text", text: crypto.randomUUID() }],
  })
);

server.tool(
  "timestamp",
  "Get current timestamp",
  {},
  async () => ({
    content: [{
      type: "text",
      text: \`ISO: \${new Date().toISOString()}\\nUnix: \${Date.now()}\`,
    }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

const tools = [
  { name: "store_set", desc: "Store key-value pairs" },
  { name: "store_get", desc: "Retrieve stored values" },
  { name: "store_list", desc: "List all keys" },
  { name: "note_create", desc: "Create a note" },
  { name: "note_list", desc: "List all notes" },
  { name: "note_read", desc: "Read note content" },
  { name: "uuid", desc: "Generate UUID" },
  { name: "timestamp", desc: "Current timestamp" },
];

export default function MultiToolChallengePage() {
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
            <Boxes className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Multi-Tool Server
            </h1>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              Build Server
            </Badge>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
              Advanced
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Build a server with 5+ interconnected tools that share state.
          </p>
        </div>

        {/* Learning Goals */}
        <Card className="mb-6 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Lightbulb className="h-5 w-5" />
              What You&apos;ll Learn
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-600 dark:text-zinc-400">
            <ul className="space-y-2">
              <li>• Managing shared state between tools</li>
              <li>• Organizing related tools into logical groups</li>
              <li>• Building CRUD operations (Create, Read, Update, Delete)</li>
              <li>• Using TypeScript for type-safe tool parameters</li>
            </ul>
          </CardContent>
        </Card>

        {/* Tools Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Available Tools (8)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tools.map((tool) => (
              <Card key={tool.name} className="p-3">
                <code className="text-sm font-medium">{tool.name}</code>
                <p className="text-xs text-zinc-500 mt-1">{tool.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Playground */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Multi-Tool MCP Server</CardTitle>
          </CardHeader>
          <CardContent>
            <MCPPlayground
              initialCode={multiToolCode}
              height="500px"
              showToolTester={true}
              title="Multi-Tool Server"
              description="8 interconnected tools"
            />
          </CardContent>
        </Card>

        {/* Success Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Success Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                At least 5 working tools
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Tools share state (store persists between calls)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Notes can be created and retrieved
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Proper error handling for missing data
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
