"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Code, Sparkles } from "lucide-react";
import { AiExampleCard, AiExampleViewer } from "@/components/examples";
import { challenges } from "@/lib/challenge-config";

interface AiExample {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  strategy: string;
  difficulty: string;
  language: string;
  code: string;
  aiProvider?: string | null;
  estimatedTokens?: number | null;
  viewCount: number;
}

const strategies = [
  { value: "all", label: "All Strategies" },
  { value: "random", label: "Random" },
  { value: "minimax", label: "Minimax" },
  { value: "a-star", label: "A* Pathfinding" },
  { value: "greedy", label: "Greedy" },
  { value: "claude", label: "Claude AI" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
];

const difficulties = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const providers = [
  { value: "all", label: "All Types" },
  { value: "algorithmic", label: "Algorithmic Only" },
  { value: "claude", label: "Claude" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
];

export function ExamplesClient() {
  const [examples, setExamples] = useState<AiExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExample, setSelectedExample] = useState<AiExample | null>(null);

  // Filters
  const [challengeFilter, setChallengeFilter] = useState("all");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchExamples = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (challengeFilter !== "all") params.set("challengeId", challengeFilter);
      if (strategyFilter !== "all") params.set("strategy", strategyFilter);
      if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter);
      if (providerFilter !== "all" && providerFilter !== "algorithmic") {
        params.set("aiProvider", providerFilter);
      }

      const res = await fetch(`/api/examples?${params.toString()}`);
      const data = await res.json() as { examples: AiExample[] };

      let filtered = data.examples || [];

      // Client-side filter for algorithmic (no AI provider)
      if (providerFilter === "algorithmic") {
        filtered = filtered.filter(e => !e.aiProvider);
      }

      // Client-side search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(e =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query)
        );
      }

      setExamples(filtered);
    } catch (error) {
      console.error("Failed to fetch examples:", error);
    } finally {
      setLoading(false);
    }
  }, [challengeFilter, strategyFilter, difficultyFilter, providerFilter, searchQuery]);

  useEffect(() => {
    fetchExamples();
  }, [fetchExamples]);

  const handleView = async (id: string) => {
    const example = examples.find(e => e.id === id);
    if (example) {
      setSelectedExample(example);
      // Increment view count
      try {
        await fetch("/api/examples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exampleId: id }),
        });
      } catch {
        // Ignore view count errors
      }
    }
  };

  const clearFilters = () => {
    setChallengeFilter("all");
    setStrategyFilter("all");
    setDifficultyFilter("all");
    setProviderFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    challengeFilter !== "all" ||
    strategyFilter !== "all" ||
    difficultyFilter !== "all" ||
    providerFilter !== "all" ||
    searchQuery !== "";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Code className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              AI Examples
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Ready-to-use AI implementations for MCP challenges. Learn from working examples
            using Claude, OpenAI, Gemini, or pure algorithmic approaches.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl font-bold text-blue-500">{examples.length}</div>
            <div className="text-sm text-zinc-500">Examples</div>
          </Card>
          <Card className="p-4 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl font-bold text-orange-500">
              {examples.filter(e => e.aiProvider === "claude").length}
            </div>
            <div className="text-sm text-zinc-500">Claude</div>
          </Card>
          <Card className="p-4 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl font-bold text-emerald-500">
              {examples.filter(e => e.aiProvider === "openai").length}
            </div>
            <div className="text-sm text-zinc-500">OpenAI</div>
          </Card>
          <Card className="p-4 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl font-bold text-purple-500">
              {examples.filter(e => !e.aiProvider).length}
            </div>
            <div className="text-sm text-zinc-500">Algorithmic</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Challenge Filter */}
            <Select value={challengeFilter} onValueChange={setChallengeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Challenge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Challenges</SelectItem>
                {Object.values(challenges).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Strategy Filter */}
            <Select value={strategyFilter} onValueChange={setStrategyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategies.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Provider Filter */}
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : examples.length === 0 ? (
          <Card className="p-12 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <Sparkles className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No examples found
            </h3>
            <p className="text-zinc-500 mb-4">
              Try adjusting your filters or search query.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examples.map((example) => (
              <AiExampleCard
                key={example.id}
                example={example}
                onView={handleView}
              />
            ))}
          </div>
        )}

        {/* Viewer Modal */}
        {selectedExample && (
          <AiExampleViewer
            example={selectedExample}
            onClose={() => setSelectedExample(null)}
          />
        )}
      </div>
    </div>
  );
}
