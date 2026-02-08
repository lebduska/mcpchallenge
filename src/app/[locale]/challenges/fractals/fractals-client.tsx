"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Play, Plug, ArrowLeft, Terminal, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";

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

const tools = [
  { name: "new_fractal", params: "preset?", description: "Start with a preset (tree, plant, dragon, koch, sierpinski, snowflake, hilbert, custom)" },
  { name: "set_axiom", params: "axiom", description: "Set the starting symbol sequence (e.g., 'F', 'FX', 'X')" },
  { name: "add_rule", params: "symbol, replacement, probability?", description: "Add production rule: symbol → replacement. Optional probability for stochastic fractals" },
  { name: "remove_rule", params: "symbol", description: "Remove all rules for a symbol" },
  { name: "set_parameters", params: "angle?, length?, iterations?, decay?", description: "Set turtle parameters: angle (0-180°), length (1-100), iterations (1-12), decay (0-1)" },
  { name: "generate", description: "Expand the L-System string (apply rules N times)" },
  { name: "render", params: "colorScheme?", description: "Render to canvas. Schemes: monochrome, depth, rainbow, forest, fire, ocean" },
  { name: "get_state", description: "Get current axiom, rules, parameters, and stats" },
];

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
          {/* Header with integrated segmented control */}
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
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">L-System Fractals</h1>
              </div>
            </div>

            <TabsList className="bg-zinc-200/50 dark:bg-zinc-800/50">
              <TabsTrigger value="play" className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Play
              </TabsTrigger>
              <TabsTrigger value="mcp" className="gap-1.5">
                <Plug className="h-3.5 w-3.5" />
                MCP
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Play Tab */}
          <TabsContent value="play" className="mt-0">
            <FractalsGame onComplete={handleGameComplete} />

            {/* How to Play */}
            <div className="mt-8 max-w-3xl mx-auto">
              <Accordion type="single" collapsible defaultValue="how-to-play">
                <AccordionItem value="how-to-play">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      How L-Systems Work
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                      <p>
                        <strong>L-Systems</strong> (Lindenmayer Systems) generate complex patterns from simple rules.
                        Start with an <strong>axiom</strong> (initial string) and apply <strong>production rules</strong>
                        repeatedly to expand it.
                      </p>
                      <div>
                        <strong>Example - Tree:</strong>
                        <div className="font-mono text-xs mt-1 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                          Axiom: F<br />
                          Rule: F → FF+[+F-F-F]-[-F+F+F]<br />
                          After 1 iteration: FF+[+F-F-F]-[-F+F+F]<br />
                          After 2 iterations: (each F replaced again...)
                        </div>
                      </div>
                      <p>
                        The expanded string is then interpreted as <strong>turtle graphics</strong> commands:
                      </p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        {turtleSymbols.map((s) => (
                          <div key={s.symbol} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                            <span className="text-purple-600 dark:text-purple-400">{s.symbol}</span>
                            <span className="text-zinc-500 ml-2">{s.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="presets">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Available Presets
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400">🌳 Tree</div>
                        <div className="text-xs text-zinc-500 mt-1">Classic branching tree pattern</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400">🌿 Plant</div>
                        <div className="text-xs text-zinc-500 mt-1">Barnsley-style fern structure</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <div className="font-medium text-red-600 dark:text-red-400">🐉 Dragon</div>
                        <div className="text-xs text-zinc-500 mt-1">Dragon curve fractal</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <div className="font-medium text-blue-600 dark:text-blue-400">❄️ Koch</div>
                        <div className="text-xs text-zinc-500 mt-1">Koch curve / snowflake</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <div className="font-medium text-purple-600 dark:text-purple-400">△ Sierpinski</div>
                        <div className="text-xs text-zinc-500 mt-1">Sierpinski triangle</div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <div className="font-medium text-cyan-600 dark:text-cyan-400">⬡ Hilbert</div>
                        <div className="text-xs text-zinc-500 mt-1">Hilbert space-filling curve</div>
                      </div>
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
