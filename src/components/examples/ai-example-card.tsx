"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Code, Bot, Cpu, Sparkles } from "lucide-react";
import { getChallengeConfig } from "@/lib/challenge-config";
import { cn } from "@/lib/utils";

interface AiExampleCardProps {
  example: {
    id: string;
    challengeId: string;
    title: string;
    description: string;
    strategy: string;
    difficulty: string;
    aiProvider?: string | null;
    estimatedTokens?: number | null;
    viewCount: number;
  };
  onView: (id: string) => void;
}

const strategyIcons: Record<string, React.ReactNode> = {
  random: <Sparkles className="h-4 w-4" />,
  minimax: <Cpu className="h-4 w-4" />,
  "a-star": <Code className="h-4 w-4" />,
  greedy: <Code className="h-4 w-4" />,
  claude: <Bot className="h-4 w-4" />,
  openai: <Bot className="h-4 w-4" />,
  gemini: <Bot className="h-4 w-4" />,
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const providerColors: Record<string, string> = {
  claude: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  openai: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  gemini: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

export function AiExampleCard({ example, onView }: AiExampleCardProps) {
  const challengeConfig = getChallengeConfig(example.challengeId);
  const Icon = challengeConfig?.icon;

  return (
    <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Challenge badge */}
          <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon className={cn("h-4 w-4", challengeConfig?.iconColor)} />}
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {challengeConfig?.name || example.challengeId}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1 truncate">
            {example.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
            {example.description}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {/* Strategy */}
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              {strategyIcons[example.strategy] || <Code className="h-3 w-3" />}
              {example.strategy}
            </Badge>

            {/* Difficulty */}
            <Badge className={cn("text-xs", difficultyColors[example.difficulty])}>
              {example.difficulty}
            </Badge>

            {/* AI Provider */}
            {example.aiProvider && (
              <Badge className={cn("text-xs", providerColors[example.aiProvider])}>
                {example.aiProvider}
                {example.estimatedTokens && (
                  <span className="ml-1 opacity-75">~{example.estimatedTokens}t</span>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* View button */}
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => onView(example.id)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>

      {/* View count */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
        <Eye className="h-3 w-3 inline mr-1" />
        {example.viewCount} views
      </div>
    </Card>
  );
}
