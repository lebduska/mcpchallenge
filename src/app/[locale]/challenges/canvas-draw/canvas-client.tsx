"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Terminal, Info } from "lucide-react";
import { PixelCanvas } from "@/components/canvas";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { ChallengeHeader } from "@/components/challenges";
import { getChallengeConfig } from "@/lib/challenge-config";

// Get tools from central config
const challengeConfig = getChallengeConfig("canvas-draw");
const tools = challengeConfig?.mcpTools || [];

export function CanvasClientPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="play" className="w-full">
          <ChallengeHeader challengeId="canvas-draw" />

          {/* PLAY MODE */}
          <TabsContent value="play" className="mt-0">
            <div className="flex flex-col items-center">
              <PixelCanvas />
            </div>

            {/* How to Play */}
            <Accordion type="single" collapsible className="w-full mt-8">
              <AccordionItem value="howto" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How it Works
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Demo Mode:</strong> The &quot;Draw Mona Lisa&quot; button simulates what an MCP client would do.
                    </p>
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Commands:</strong> Each drawing command (set_color, draw_line, etc.) is executed step by step.
                    </p>
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Canvas:</strong> 64×64 pixels with RGB colors (0-255).
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* MCP MODE */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            {/* Live Game Board */}
            <LiveGameBoard gameType="canvas" />

            {/* MCP Tools */}
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
