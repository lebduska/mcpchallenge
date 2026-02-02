"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Paintbrush, Copy, CheckCircle2, Plug, Terminal } from "lucide-react";
import { PixelCanvas } from "@/components/canvas";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const claudeConfig = `{
  "mcpServers": {
    "canvas-draw": {
      "url": "https://mcp.mcpchallenge.org/canvas"
    }
  }
}`;

const cursorConfig = `// In Cursor Settings → MCP Servers
{
  "canvas-draw": {
    "url": "https://mcp.mcpchallenge.org/canvas"
  }
}`;

const tools = [
  {
    name: "set_color",
    params: "r, g, b",
    description: "Set drawing color (RGB 0-255)",
    example: 'set_color(139, 90, 43) // Brown',
  },
  {
    name: "set_pixel",
    params: "x, y",
    description: "Draw single pixel at coordinates",
    example: "set_pixel(32, 32) // Center pixel",
  },
  {
    name: "draw_line",
    params: "x1, y1, x2, y2",
    description: "Draw line between two points",
    example: "draw_line(0, 0, 63, 63) // Diagonal",
  },
  {
    name: "draw_circle",
    params: "cx, cy, r, filled?",
    description: "Draw circle at center with radius",
    example: "draw_circle(32, 32, 10, true)",
  },
  {
    name: "draw_rect",
    params: "x, y, w, h, filled?",
    description: "Draw rectangle",
    example: "draw_rect(10, 10, 20, 15, false)",
  },
  {
    name: "fill",
    params: "x, y",
    description: "Flood fill from point",
    example: "fill(32, 32) // Fill area",
  },
  {
    name: "clear",
    params: "",
    description: "Reset canvas to white",
    example: "clear()",
  },
  {
    name: "get_canvas",
    params: "",
    description: "Get current pixel data",
    example: "get_canvas() // Returns JSON",
  },
];

export default function CanvasDrawChallengePage() {
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(key);
    setTimeout(() => setCopiedConfig(null), 2000);
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
            <Paintbrush className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Canvas Drawing
            </h1>
            <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100">
              Creative
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
              HTTP+SSE
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Connect your MCP client to our canvas server and create pixel art!
            Challenge your AI to draw the Mona Lisa.
          </p>
        </div>

        {/* How it works */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Plug className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-700 dark:text-zinc-300">
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span>Connect your MCP client (Claude Desktop, Cursor, etc.) to our server</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span>Ask your AI to draw something using the available tools</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span>Watch your creation appear on the canvas below in real-time!</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Connection Config */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Connect to MCP Server
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="claude" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
                <TabsTrigger value="cursor">Cursor</TabsTrigger>
                <TabsTrigger value="other">Other Clients</TabsTrigger>
              </TabsList>

              <TabsContent value="claude">
                <div className="relative">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Add to your <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">claude_desktop_config.json</code>:
                  </p>
                  <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg text-sm overflow-x-auto">
                    {claudeConfig}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(claudeConfig, "claude")}
                    className="absolute top-10 right-2 p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    {copiedConfig === "claude" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="cursor">
                <div className="relative">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Add in Cursor Settings → Features → MCP Servers:
                  </p>
                  <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg text-sm overflow-x-auto">
                    {cursorConfig}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(cursorConfig, "cursor")}
                    className="absolute top-10 right-2 p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    {copiedConfig === "cursor" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="other">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                  <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                    <strong>Server URL:</strong>
                  </p>
                  <code className="block p-3 bg-zinc-200 dark:bg-zinc-800 rounded text-sm">
                    https://mcp.mcpchallenge.org/canvas
                  </code>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">
                    Transport: HTTP + Server-Sent Events (SSE)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live Canvas */}
        <div className="mb-6">
          <PixelCanvas />
        </div>

        {/* Available Tools */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Available Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between mb-1">
                    <code className="text-pink-600 dark:text-pink-400 font-bold">
                      {tool.name}
                    </code>
                    <code className="text-xs text-zinc-500">
                      ({tool.params})
                    </code>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    {tool.description}
                  </p>
                  <code className="text-xs text-zinc-500 dark:text-zinc-500 block">
                    {tool.example}
                  </code>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Canvas:</strong> 64x64 pixels |
                <strong> Coordinates:</strong> (0,0) top-left to (63,63) bottom-right |
                <strong> Colors:</strong> RGB 0-255
              </p>
            </div>
          </CardContent>
        </Card>

        {/* The Challenge */}
        <Card className="mb-6 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-amber-50 dark:from-pink-950/50 dark:to-amber-950/50">
          <CardHeader>
            <CardTitle className="text-pink-600 dark:text-pink-400 flex items-center gap-2">
              <span className="text-2xl">🎨</span> The Challenge: Draw Mona Lisa!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-700 dark:text-zinc-300">
            <p className="mb-4">
              Once connected, give your AI this prompt:
            </p>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-pink-200 dark:border-pink-800 font-mono text-sm mb-4">
              &quot;Using the canvas drawing tools, create the best possible
              representation of the Mona Lisa on the 64x64 pixel canvas.
              Focus on her iconic features - the mysterious smile,
              dark hair, and famous pose.&quot;
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Share your creation! Screenshot and post with <strong>#MCPChallenge</strong>
            </p>
          </CardContent>
        </Card>

        {/* Ideas */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-600 dark:text-zinc-400">
              More Ideas to Try
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-600 dark:text-zinc-400">
            <ul className="space-y-2">
              <li>• Draw a landscape with mountains and sun</li>
              <li>• Create pixel art of your favorite game character</li>
              <li>• Make abstract geometric patterns</li>
              <li>• Draw a self-portrait (ask AI to be creative!)</li>
              <li>• Recreate famous logos in 64x64 pixels</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
