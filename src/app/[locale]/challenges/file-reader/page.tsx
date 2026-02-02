"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, CheckCircle2, Lightbulb } from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";
import { ChallengeCompletion } from "@/components/challenges";

const completionSteps = [
  { id: "understand-fs", title: "Understood Node.js fs/promises for file operations" },
  { id: "create-read", title: "Created the read_file tool" },
  { id: "create-list", title: "Created the list_dir tool with file/folder icons" },
  { id: "create-search", title: "Created the search_file tool with line numbers" },
  { id: "test-playground", title: "Tested all tools in the playground" },
];

const fileReaderCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const server = new McpServer({
  name: "file-reader-server",
  version: "1.0.0",
});

// Read file contents
server.tool(
  "read_file",
  "Read contents of a file",
  {
    filepath: z.string().describe("Path to the file"),
  },
  async ({ filepath }) => {
    try {
      const content = await fs.readFile(filepath, "utf-8");
      return {
        content: [{
          type: "text",
          text: content,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: \`Error reading file: \${error.message}\`,
        }],
        isError: true,
      };
    }
  }
);

// List directory
server.tool(
  "list_dir",
  "List files in a directory",
  {
    dirpath: z.string().describe("Path to directory"),
  },
  async ({ dirpath }) => {
    try {
      const files = await fs.readdir(dirpath, { withFileTypes: true });
      const list = files.map(f =>
        \`\${f.isDirectory() ? "📁" : "📄"} \${f.name}\`
      ).join("\\n");
      return {
        content: [{
          type: "text",
          text: list || "Empty directory",
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: \`Error: \${error.message}\`,
        }],
        isError: true,
      };
    }
  }
);

// Search in file
server.tool(
  "search_file",
  "Search for a pattern in a file",
  {
    filepath: z.string().describe("Path to the file"),
    pattern: z.string().describe("Text pattern to search for"),
  },
  async ({ filepath, pattern }) => {
    try {
      const content = await fs.readFile(filepath, "utf-8");
      const lines = content.split("\\n");
      const matches = lines
        .map((line, i) => ({ line, num: i + 1 }))
        .filter(({ line }) => line.includes(pattern));

      if (matches.length === 0) {
        return {
          content: [{
            type: "text",
            text: \`No matches found for "\${pattern}"\`,
          }],
        };
      }

      const result = matches
        .map(({ line, num }) => \`Line \${num}: \${line}\`)
        .join("\\n");

      return {
        content: [{
          type: "text",
          text: \`Found \${matches.length} matches:\\n\\n\${result}\`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: \`Error: \${error.message}\`,
        }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

export default function FileReaderChallengePage() {
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
            <FileText className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              File Reader
            </h1>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              Use Tools
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
              Intermediate
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Build a file system MCP server that reads files and searches content.
          </p>
        </div>

        {/* Tools Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">read_file</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Read entire file contents
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">list_dir</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              List files in directory
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">search_file</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
              Find pattern in file
            </CardContent>
          </Card>
        </div>

        {/* Playground */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>File Reader MCP Server</CardTitle>
          </CardHeader>
          <CardContent>
            <MCPPlayground
              initialCode={fileReaderCode}
              height="500px"
              showToolTester={true}
              title="File Reader Server"
              description="File system operations"
            />
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card className="border-amber-200 dark:border-amber-800 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-5 w-5" />
              Security Consideration
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-600 dark:text-zinc-400">
            <p>
              In production, you should restrict file access to specific directories.
              Consider adding path validation to prevent directory traversal attacks.
            </p>
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
                Can read text files
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Handles file not found errors gracefully
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Search returns line numbers with matches
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Progress Tracking */}
        <ChallengeCompletion
          challengeId="file-reader"
          steps={completionSteps}
        />
      </div>
    </div>
  );
}
