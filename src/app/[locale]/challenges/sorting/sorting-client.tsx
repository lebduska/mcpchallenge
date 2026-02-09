"use client";

export const runtime = "edge";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Terminal, Info, Cpu } from "lucide-react";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { ChallengeHeader } from "@/components/challenges";
import { getChallengeConfig } from "@/lib/challenge-config";
import { cn } from "@/lib/utils";

// Level info from the engine
const LEVELS = [
  { id: 1, name: "Baby Steps", size: 3, parComparisons: 4, parSwaps: 3 },
  { id: 2, name: "Getting Started", size: 5, parComparisons: 12, parSwaps: 10 },
  { id: 3, name: "Small Array", size: 8, parComparisons: 29, parSwaps: 24 },
  { id: 4, name: "Double Digits", size: 10, parComparisons: 48, parSwaps: 40 },
  { id: 5, name: "Growing Pains", size: 15, parComparisons: 72, parSwaps: 60 },
  { id: 6, name: "Score Challenge", size: 20, parComparisons: 120, parSwaps: 100 },
  { id: 7, name: "Algorithm Test", size: 30, parComparisons: 180, parSwaps: 150 },
  { id: 8, name: "Scaling Up", size: 50, parComparisons: 360, parSwaps: 300 },
  { id: 9, name: "Performance Critical", size: 75, parComparisons: 540, parSwaps: 450 },
  { id: 10, name: "The Gauntlet", size: 100, parComparisons: 840, parSwaps: 700 },
];

// Get tools from central config
const challengeConfig = getChallengeConfig("sorting");
const mcpTools = challengeConfig?.mcpTools || [];

// Seeded pseudo-random number generator for deterministic demo bars
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function SortingClientPage() {
  const t = useTranslations("challenges.sorting");
  const [selectedLevel, setSelectedLevel] = useState(1);

  // Pre-generate bar heights for demo visualization (deterministic based on level)
  const demoBarHeights = useMemo(() => {
    const random = seededRandom(selectedLevel * 1000);
    return Array.from({ length: 15 }, () => random() * 0.8 + 0.2);
  }, [selectedLevel]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="mcp" className="w-full">
          <ChallengeHeader
            challengeId="sorting"
            tabs={[
              { value: "learn", label: "Learn", icon: "learn" },
              { value: "mcp", label: "MCP", icon: "mcp" },
            ]}
          />

          {/* LEARN MODE */}
          <TabsContent value="learn" className="mt-0">
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-center">{t("description")}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Levels */}
              <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Levels</h3>
                <div className="space-y-2">
                  {LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setSelectedLevel(level.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all border",
                        selectedLevel === level.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {level.id}. {level.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          n={level.size}
                        </Badge>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Par: {level.parComparisons} comparisons, {level.parSwaps} swaps
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Visual */}
              <Card className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <div className="text-center">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                    Level {selectedLevel}: {LEVELS[selectedLevel - 1].name}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    Sort an array of {LEVELS[selectedLevel - 1].size} elements using only compare and swap operations.
                  </p>

                  {/* Demo bars */}
                  <div className="flex items-end justify-center gap-2 h-40 mb-6">
                    {Array.from({ length: Math.min(LEVELS[selectedLevel - 1].size, 15) }, (_, i) => (
                      <div
                        key={i}
                        className="bg-purple-500 rounded-t transition-all"
                        style={{
                          width: Math.max(12, 200 / LEVELS[selectedLevel - 1].size),
                          height: `${demoBarHeights[i] * 100}%`,
                        }}
                      />
                    ))}
                    {LEVELS[selectedLevel - 1].size > 15 && (
                      <span className="text-zinc-400 text-sm ml-2">
                        +{LEVELS[selectedLevel - 1].size - 15} more
                      </span>
                    )}
                  </div>

                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-purple-500">
                          {LEVELS[selectedLevel - 1].parComparisons}
                        </div>
                        <div className="text-xs text-zinc-500">Par Comparisons</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-500">
                          {LEVELS[selectedLevel - 1].parSwaps}
                        </div>
                        <div className="text-xs text-zinc-500">Par Swaps</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-zinc-500">
                          O(n log n)
                        </div>
                        <div className="text-xs text-zinc-500">Target Complexity</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Educational Content */}
            <div className="mt-8 max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                <AccordionItem value="howto" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      How It Works
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-2 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <p><strong className="text-zinc-900 dark:text-white">Goal:</strong> Sort a randomly shuffled array using only two operations: compare and swap.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Twist:</strong> You cannot see the actual values! Only the relative heights are shown for visualization.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Scoring:</strong> Beat the par to earn 3 stars. Par is based on O(n log n) algorithms like MergeSort.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Challenge:</strong> Can your AI discover QuickSort, MergeSort, or HeapSort on its own?</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="algorithms" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Algorithm Complexity
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-red-600 dark:text-red-400 text-sm">Bubble Sort - O(n)</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Simple but slow. Compares adjacent pairs repeatedly. Wont pass higher levels!
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-yellow-600 dark:text-yellow-400 text-sm">Insertion Sort - O(n)</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Good for small arrays. Builds sorted portion element by element.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400 text-sm">QuickSort - O(n log n) average</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Divide and conquer. Pick pivot, partition, recurse. Very efficient in practice.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400 text-sm">MergeSort - O(n log n)</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Split in half, sort recursively, merge. Guaranteed O(n log n) but uses extra space.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400 text-sm">HeapSort - O(n log n)</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Build a heap, extract max repeatedly. In-place with guaranteed complexity.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* MCP MODE */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            <p className="text-zinc-600 dark:text-zinc-400 text-center">{t("description")}</p>

            {/* Live Game Board */}
            <LiveGameBoard gameType="sorting" />

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                    {mcpTools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex flex-col p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <code className="text-purple-600 dark:text-purple-400 font-mono text-sm font-semibold">
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
