"use client";

export const runtime = "edge";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Terminal, Info } from "lucide-react";
import { PolyBridgeGame } from "@/components/games/poly-bridge";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { ChallengeHeader, ChallengeSnippets } from "@/components/challenges";
import { getChallengeConfig } from "@/lib/challenge-config";

// Get tools from central config
const challengeConfig = getChallengeConfig("poly-bridge");
const tools = challengeConfig?.mcpTools || [];

export default function PolyBridgeChallengePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="play" className="w-full">
          <ChallengeHeader challengeId="poly-bridge" />

          {/* PLAY MODE */}
          <TabsContent value="play" className="mt-0">
            <div className="flex flex-col items-center">
              <PolyBridgeGame />
            </div>

            {/* How to Play */}
            <Accordion type="single" collapsible className="w-full mt-8">
              <AccordionItem value="howto" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How to Play
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Goal:</strong> Build a bridge that allows the vehicle to cross from start (red) to end (green).
                    </p>
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Tools:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li><strong>Beam:</strong> Main structural element. Choose wood (cheap) or steel (strong).</li>
                      <li><strong>Cable:</strong> Flexible suspension cables for hanging structures.</li>
                      <li><strong>Road:</strong> Vehicle driving surface - connect to beams.</li>
                      <li><strong>Delete:</strong> Click structures to remove them.</li>
                    </ul>
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Tips:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Connect structures to green anchor points for stability.</li>
                      <li>Triangles are strong! Use truss patterns for wide gaps.</li>
                      <li>Stay within budget - cost shown per material type.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* MCP MODE */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            {/* Live Game Board */}
            <LiveGameBoard gameType="polybridge" />

            {/* Quick Start Code Snippets */}
            <ChallengeSnippets challengeId="poly-bridge" />

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
                        <code className="text-cyan-600 dark:text-cyan-400 font-mono text-sm font-semibold">
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
