"use client";

import Link from "next/link";
import { ArrowLeft, Play, Plug, BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getChallengeConfig,
  getCategoryTheme,
  type ChallengeCategory,
} from "@/lib/challenge-config";
import { cn } from "@/lib/utils";

interface ChallengeHeaderProps {
  challengeId: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
  tabs?: Array<{ value: string; label: string; icon?: "play" | "mcp" | "learn" }>;
}

/**
 * Unified challenge header component
 * Provides consistent visual language across all challenges
 */
export function ChallengeHeader({
  challengeId,
  activeTab,
  onTabChange,
  tabs = [
    { value: "play", label: "Play", icon: "play" },
    { value: "mcp", label: "MCP", icon: "mcp" },
  ],
}: ChallengeHeaderProps) {
  const config = getChallengeConfig(challengeId);

  if (!config) {
    return null;
  }

  const theme = getCategoryTheme(config.category);
  const Icon = config.icon;

  const getTabIcon = (icon?: string) => {
    switch (icon) {
      case "play":
        return <Play className="h-3.5 w-3.5 mr-1.5" />;
      case "mcp":
        return <Plug className="h-3.5 w-3.5 mr-1.5" />;
      case "learn":
        return <BookOpen className="h-3.5 w-3.5 mr-1.5" />;
      default:
        return null;
    }
  };

  const getTabColor = (icon?: string, category?: ChallengeCategory) => {
    if (icon === "mcp") {
      return "data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400";
    }
    // Play and Learn tabs use category color
    const catTheme = category ? getCategoryTheme(category) : theme;
    return `data-[state=active]:${catTheme.playColor} dark:${catTheme.playColorDark}`;
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left side: Back link + Title */}
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
          <Icon className={cn("h-5 w-5", config.iconColor)} />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {config.shortName}
          </h1>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-5",
              theme.badgeBg,
              theme.badgeBgDark,
              theme.badgeText,
              theme.badgeTextDark
            )}
          >
            {theme.name}
          </Badge>
        </div>
      </div>

      {/* Right side: Tab switcher */}
      {tabs.length > 0 && (
        <TabsList className="h-9 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "h-7 px-4 text-sm font-medium rounded-md transition-all",
                "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800",
                "data-[state=active]:shadow-sm",
                getTabColor(tab.icon, config.category)
              )}
            >
              {getTabIcon(tab.icon)}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
    </div>
  );
}

/**
 * Challenge tools reference panel
 * Shows MCP tools available for the challenge
 */
export function ChallengeToolsPanel({ challengeId }: { challengeId: string }) {
  const config = getChallengeConfig(challengeId);

  if (!config) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Available MCP Tools
      </h3>
      <div className="space-y-1.5">
        {config.mcpTools.map((tool) => (
          <div
            key={tool.name}
            className="flex items-start gap-2 text-sm"
          >
            <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-blue-600 dark:text-blue-400">
              {tool.name}
              {tool.params && (
                <span className="text-zinc-500">({tool.params})</span>
              )}
            </code>
            <span className="text-zinc-600 dark:text-zinc-400 text-xs">
              {tool.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
