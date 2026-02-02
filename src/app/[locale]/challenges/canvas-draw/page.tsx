"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Paintbrush, Copy, CheckCircle2, Play, Plug } from "lucide-react";
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
  { name: "set_color", params: "r, g, b", description: "Set drawing color (RGB 0-255)" },
  { name: "set_pixel", params: "x, y", description: "Draw single pixel at coordinates" },
  { name: "draw_line", params: "x1, y1, x2, y2", description: "Draw line between two points" },
  { name: "draw_circle", params: "cx, cy, r, filled?", description: "Draw circle at center with radius" },
  { name: "draw_rect", params: "x, y, w, h, filled?", description: "Draw rectangle" },
  { name: "fill", params: "x, y", description: "Flood fill from point" },
  { name: "clear", params: "", description: "Reset canvas to white" },
  { name: "get_canvas", params: "", description: "Get current pixel data" },
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
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Create pixel art on a 64x64 canvas. Play the demo or connect your MCP client!
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="play" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="play" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Play Now
            </TabsTrigger>
            <TabsTrigger value="mcp" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Connect MCP
            </TabsTrigger>
          </TabsList>

          {/* PLAY NOW TAB */}
          <TabsContent value="play" className="space-y-6">
            <Card className="border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-amber-50 dark:from-pink-950/30 dark:to-amber-950/30">
              <CardContent className="pt-6">
                <p className="text-zinc-700 dark:text-zinc-300 mb-4 text-center">
                  Watch the AI draw the Mona Lisa using drawing primitives!
                </p>
              </CardContent>
            </Card>

            {/* Live Canvas with Mona Lisa button */}
            <PixelCanvas />

            {/* Canvas Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Demo</CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-600 dark:text-zinc-400 text-sm space-y-2">
                <p>
                  The &quot;Draw Mona Lisa&quot; button simulates what an MCP client would do -
                  it sends a sequence of drawing commands to create pixel art.
                </p>
                <p>
                  Each command (set_color, draw_line, draw_circle, etc.) is executed
                  step by step, just like an AI would call the MCP tools.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONNECT MCP TAB */}
          <TabsContent value="mcp" className="space-y-6">
            {/* How it works */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
              <CardHeader>
                <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-700 dark:text-zinc-300">
                <ol className="space-y-2">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                    <span>Connect your MCP client to our canvas server</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                    <span>Ask your AI to draw something using the available tools</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                    <span>Watch your creation appear on the canvas in real-time!</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Connection Config */}
            <Card>
              <CardHeader>
                <CardTitle>Server Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="claude" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
                    <TabsTrigger value="cursor">Cursor</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                  </TabsList>

                  <TabsContent value="claude">
                    <div className="relative">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        Add to <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">claude_desktop_config.json</code>:
                      </p>
                      <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg text-sm overflow-x-auto">
                        {claudeConfig}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(claudeConfig, "claude")}
                        className="absolute top-10 right-2 p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        {copiedConfig === "claude" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="cursor">
                    <div className="relative">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        In Cursor Settings → Features → MCP Servers:
                      </p>
                      <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg text-sm overflow-x-auto">
                        {cursorConfig}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(cursorConfig, "cursor")}
                        className="absolute top-10 right-2 p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        {copiedConfig === "cursor" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="other">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <p className="text-zinc-700 dark:text-zinc-300 mb-2"><strong>Server URL:</strong></p>
                      <code className="block p-3 bg-zinc-200 dark:bg-zinc-800 rounded text-sm">
                        https://mcp.mcpchallenge.org/canvas
                      </code>
                      <p className="text-sm text-zinc-500 mt-2">Transport: HTTP + SSE</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Available Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Available Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {tools.map((tool) => (
                    <div key={tool.name} className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                      <code className="text-pink-600 dark:text-pink-400 font-bold text-sm">{tool.name}</code>
                      <p className="text-xs text-zinc-500 mt-1">{tool.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Canvas:</strong> 64x64 pixels | <strong>Colors:</strong> RGB 0-255
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Live Canvas for MCP */}
            <Card>
              <CardHeader>
                <CardTitle>Live Canvas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  When your MCP client sends drawing commands, they will appear here in real-time.
                </p>
                <PixelCanvas />
              </CardContent>
            </Card>

            {/* Challenge prompt */}
            <Card className="border-pink-200 dark:border-pink-800">
              <CardHeader>
                <CardTitle className="text-pink-600 dark:text-pink-400">
                  Challenge: Draw Mona Lisa!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Try this prompt:</p>
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded font-mono text-sm">
                  &quot;Using the canvas drawing tools, create the Mona Lisa on the 64x64 pixel canvas.&quot;
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
