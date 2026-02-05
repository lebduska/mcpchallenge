"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Paintbrush, Play, Plug, Terminal, ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PixelCanvas } from "@/components/canvas";
import { cn } from "@/lib/utils";

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
  { name: "clear", description: "Reset canvas to white" },
  { name: "get_canvas", description: "Get current pixel data" },
];

export default function CanvasDrawChallengePage() {
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(key);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="play" className="w-full">
          {/* Compact Header with integrated segmented control */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/challenges"
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Challenges
              </Link>
              <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5 text-pink-500" />
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Canvas Drawing</h1>
              </div>
            </div>

            {/* Segmented Control - Mode Switch */}
            <TabsList className="h-9 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <TabsTrigger
                value="play"
                className={cn(
                  "h-7 px-4 text-sm font-medium rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800",
                  "data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400",
                  "data-[state=active]:shadow-sm"
                )}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Play
              </TabsTrigger>
              <TabsTrigger
                value="mcp"
                className={cn(
                  "h-7 px-4 text-sm font-medium rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800",
                  "data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
                  "data-[state=active]:shadow-sm"
                )}
              >
                <Plug className="h-3.5 w-3.5 mr-1.5" />
                MCP
              </TabsTrigger>
            </TabsList>
          </div>

          {/* PLAY MODE */}
          <TabsContent value="play" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Canvas */}
              <div className="lg:col-span-2">
                <PixelCanvas />
              </div>

              {/* Right: Info */}
              <div className="space-y-4">
                <div className="rounded-xl p-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    About
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    The &quot;Draw Mona Lisa&quot; button simulates what an MCP client would do -
                    it sends a sequence of drawing commands to create pixel art.
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Each command (set_color, draw_line, draw_circle, etc.) is executed
                    step by step, just like an AI would call the MCP tools.
                  </p>
                </div>

                <div className="rounded-xl p-4 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800">
                  <h3 className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                    Canvas Specs
                  </h3>
                  <p className="text-sm text-pink-800 dark:text-pink-200">
                    <strong>Size:</strong> 64x64 pixels | <strong>Colors:</strong> RGB 0-255
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* MCP MODE */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            {/* Live Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="rounded-xl p-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    Live Canvas
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    When your MCP client sends drawing commands, they will appear here in real-time.
                  </p>
                  <PixelCanvas />
                </div>
              </div>

              {/* Right: Config */}
              <div className="space-y-4">
                <div className="rounded-xl p-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    Server Configuration
                  </h3>

                  <Tabs defaultValue="claude" className="w-full">
                    <TabsList className="mb-3 w-full">
                      <TabsTrigger value="claude" className="flex-1 text-xs">Claude</TabsTrigger>
                      <TabsTrigger value="cursor" className="flex-1 text-xs">Cursor</TabsTrigger>
                    </TabsList>

                    <TabsContent value="claude">
                      <div className="relative">
                        <p className="text-xs text-zinc-500 mb-2">
                          Add to <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">claude_desktop_config.json</code>:
                        </p>
                        <pre className="p-3 bg-zinc-900 text-zinc-100 rounded-lg text-xs overflow-x-auto">
                          {claudeConfig}
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-8 right-2 h-6 w-6"
                          onClick={() => copyToClipboard(claudeConfig, "claude")}
                        >
                          {copiedConfig === "claude" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="cursor">
                      <div className="relative">
                        <p className="text-xs text-zinc-500 mb-2">
                          In Cursor Settings → Features → MCP Servers:
                        </p>
                        <pre className="p-3 bg-zinc-900 text-zinc-100 rounded-lg text-xs overflow-x-auto">
                          {cursorConfig}
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-8 right-2 h-6 w-6"
                          onClick={() => copyToClipboard(cursorConfig, "cursor")}
                        >
                          {copiedConfig === "cursor" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="rounded-xl p-4 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800">
                  <h3 className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                    Challenge
                  </h3>
                  <p className="text-xs text-pink-800 dark:text-pink-200 mb-2">
                    Try this prompt with your MCP client:
                  </p>
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded text-xs font-mono text-pink-900 dark:text-pink-100">
                    &quot;Using the canvas drawing tools, create the Mona Lisa on the 64x64 pixel canvas.&quot;
                  </div>
                </div>
              </div>
            </div>

            {/* Tools & Config - in accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="tools" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Available MCP Tools
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pb-2">
                    {tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex flex-col p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <code className="text-pink-600 dark:text-pink-400 font-mono text-sm font-semibold">
                          {tool.name}
                          {tool.params && (
                            <span className="text-zinc-400 dark:text-zinc-600">({tool.params})</span>
                          )}
                        </code>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{tool.description}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
