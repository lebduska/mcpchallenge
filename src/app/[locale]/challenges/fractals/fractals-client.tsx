"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Terminal, Info, Loader2, BookOpen, Cpu } from "lucide-react";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { ChallengeHeader } from "@/components/challenges";
import { getChallengeConfig } from "@/lib/challenge-config";

// Dynamic imports to avoid SSR issues with game engines
const FractalsGame = dynamic(
  () => import("@/components/games/fractals").then(mod => mod.FractalsGame),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

const LiveGameBoard = dynamic(
  () => import("@/components/mcp/live-game-board").then(mod => mod.LiveGameBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

// Get tools from central config
const challengeConfig = getChallengeConfig("fractals");
const tools = challengeConfig?.mcpTools || [];

const turtleSymbols = [
  { symbol: "F", description: "Move forward, draw line" },
  { symbol: "f", description: "Move forward, no draw" },
  { symbol: "+", description: "Turn left by angle" },
  { symbol: "-", description: "Turn right by angle" },
  { symbol: "[", description: "Push position/angle to stack" },
  { symbol: "]", description: "Pop position/angle from stack" },
  { symbol: "X, Y, A, B", description: "Auxiliary symbols (no drawing)" },
];

export function FractalsClientPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("fractals");

  const handleGameComplete = useCallback(
    async (state: { stats: { segmentsDrawn: number } }) => {
      if (state.stats.segmentsDrawn > 100) {
        const response = await submitCompletion({
          winner: "player",
          moves: state.stats.segmentsDrawn,
        });
        if (response?.newAchievements && response.newAchievements.length > 0) {
          setUnlockedAchievements(response.newAchievements);
        }
      }
    },
    [submitCompletion]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="play" className="w-full">
          <ChallengeHeader challengeId="fractals" />

          {/* Play Tab */}
          <TabsContent value="play" className="mt-0">
            <FractalsGame onComplete={handleGameComplete} />

            {/* How to Play */}
            <div className="mt-8 max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                <AccordionItem value="how-to-play" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      How L-Systems Work
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400 pb-2">
                      <p>
                        <strong className="text-zinc-900 dark:text-white">L-Systems</strong> (Lindenmayer Systems) generate complex patterns from simple rules.
                        Start with an <strong className="text-zinc-900 dark:text-white">axiom</strong> (initial string) and apply <strong className="text-zinc-900 dark:text-white">production rules</strong>
                        repeatedly to expand it.
                      </p>
                      <div>
                        <strong className="text-zinc-900 dark:text-white">Example - Tree:</strong>
                        <div className="font-mono text-xs mt-1 p-2 bg-zinc-100 dark:bg-zinc-900 rounded">
                          Axiom: F<br />
                          Rule: F → FF+[+F-F-F]-[-F+F+F]<br />
                          After 1 iteration: FF+[+F-F-F]-[-F+F+F]<br />
                          After 2 iterations: (each F replaced again...)
                        </div>
                      </div>
                      <p>
                        The expanded string is then interpreted as <strong className="text-zinc-900 dark:text-white">turtle graphics</strong> commands:
                      </p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        {turtleSymbols.map((s) => (
                          <div key={s.symbol} className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded">
                            <span className="text-purple-600 dark:text-purple-400">{s.symbol}</span>
                            <span className="text-zinc-500 ml-2">{s.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="presets" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Available Presets
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400">🌳 Tree</div>
                        <div className="text-xs text-zinc-500 mt-1">Classic branching tree pattern</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400">🌿 Plant</div>
                        <div className="text-xs text-zinc-500 mt-1">Barnsley-style fern structure</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-red-600 dark:text-red-400">🐉 Dragon</div>
                        <div className="text-xs text-zinc-500 mt-1">Dragon curve fractal</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-blue-600 dark:text-blue-400">❄️ Koch</div>
                        <div className="text-xs text-zinc-500 mt-1">Koch curve / snowflake</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-purple-600 dark:text-purple-400">△ Sierpinski</div>
                        <div className="text-xs text-zinc-500 mt-1">Sierpinski triangle</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-cyan-600 dark:text-cyan-400">⬡ Hilbert</div>
                        <div className="text-xs text-zinc-500 mt-1">Hilbert space-filling curve</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Origins in Biology
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 pb-2">
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1968:</strong> Aristid Lindenmayer, a Hungarian biologist, invented L-Systems
                        to model the growth of algae and plants. His goal was to describe cell development mathematically.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1984:</strong> &quot;The Algorithmic Beauty of Plants&quot; by Prusinkiewicz & Lindenmayer
                        became the seminal work, showing how simple rules create realistic botanical forms.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Hollywood:</strong> L-Systems generated the forests in Avatar, Game of Thrones,
                        and countless films. SpeedTree and other tools use L-System variants for procedural vegetation.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs">
                        Fun fact: The Dragon curve was discovered independently in 1966 by NASA physicists studying paper-folding patterns.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mathematics" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      The Mathematics
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-purple-600 dark:text-purple-400 text-sm">Formal Grammar</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          L-Systems are a type of parallel rewriting system — all symbols are replaced simultaneously
                          in each step. This differs from sequential Chomsky grammars where one rule applies at a time.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-purple-600 dark:text-purple-400 text-sm">Self-Similarity</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Fractals exhibit self-similarity — zoom in and you see the same patterns.
                          The Koch curve has infinite length contained in a finite area. Its fractal dimension is ~1.26.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-purple-600 dark:text-purple-400 text-sm">Stochastic L-Systems</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Adding probability to rules creates natural variation. Multiple productions for the same symbol
                          are chosen randomly, yielding unique trees each render while maintaining overall structure.
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Extensions: Parametric L-Systems add numerical values; context-sensitive L-Systems consider neighbors.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* MCP Tab */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            <LiveGameBoard gameType="fractals" />

            {/* MCP Tools Reference */}
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible defaultValue="tools">
                <AccordionItem value="tools">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Available MCP Tools
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                        >
                          <div className="font-mono text-sm">
                            <span className="text-blue-600 dark:text-blue-400">
                              {tool.name}
                            </span>
                            {tool.params && (
                              <span className="text-zinc-500">
                                ({tool.params})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {tool.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="example">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Example Session
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="font-mono text-xs space-y-2 p-3 bg-zinc-900 text-zinc-100 rounded-lg">
                      <div className="text-zinc-500"># Create a custom stochastic tree</div>
                      <div><span className="text-green-400">→</span> new_fractal(preset: &quot;custom&quot;)</div>
                      <div><span className="text-green-400">→</span> set_axiom(axiom: &quot;F&quot;)</div>
                      <div><span className="text-green-400">→</span> add_rule(symbol: &quot;F&quot;, replacement: &quot;F[+F]F[-F]F&quot;, probability: 0.7)</div>
                      <div><span className="text-green-400">→</span> add_rule(symbol: &quot;F&quot;, replacement: &quot;FF&quot;, probability: 0.3)</div>
                      <div><span className="text-green-400">→</span> set_parameters(angle: 25, iterations: 5)</div>
                      <div><span className="text-green-400">→</span> render(colorScheme: &quot;forest&quot;)</div>
                      <div className="text-zinc-500 mt-3"># Explore dragon curve</div>
                      <div><span className="text-green-400">→</span> new_fractal(preset: &quot;dragon&quot;)</div>
                      <div><span className="text-green-400">→</span> set_parameters(iterations: 14)</div>
                      <div><span className="text-green-400">→</span> render(colorScheme: &quot;rainbow&quot;)</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Achievement Toast */}
      {unlockedAchievements.length > 0 && (
        <AchievementToast
          achievements={unlockedAchievements}
          onClose={() => setUnlockedAchievements([])}
        />
      )}
    </div>
  );
}
