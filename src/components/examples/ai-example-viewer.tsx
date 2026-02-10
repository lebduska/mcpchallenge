"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X, Copy, Check, ExternalLink, Bot, Cpu, Code } from "lucide-react";
import { getChallengeConfig } from "@/lib/challenge-config";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
}

interface AiExampleViewerProps {
  example: AiExample;
  onClose: () => void;
}

const providerDocs: Record<string, string> = {
  claude: "https://docs.anthropic.com/claude/reference",
  openai: "https://platform.openai.com/docs/api-reference",
  gemini: "https://ai.google.dev/api/generate-content",
};

export function AiExampleViewer({ example, onClose }: AiExampleViewerProps) {
  const t = useTranslations("examples");
  const [copied, setCopied] = useState(false);
  const challengeConfig = getChallengeConfig(example.challengeId);
  const Icon = challengeConfig?.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(example.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {Icon && <Icon className={cn("h-5 w-5", challengeConfig?.iconColor)} />}
              <span className="text-sm text-zinc-500">
                {challengeConfig?.name}
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {example.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {example.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="flex items-center gap-1">
                {example.aiProvider ? <Bot className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
                {example.strategy}
              </Badge>
              <Badge variant="outline">
                {example.difficulty}
              </Badge>
              <Badge variant="outline">
                {example.language}
              </Badge>
              {example.aiProvider && example.estimatedTokens && (
                <Badge variant="outline" className="text-xs">
                  ~{example.estimatedTokens} tokens/move
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Code */}
        <div className="relative overflow-auto max-h-[60vh]">
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="bg-zinc-800/80 hover:bg-zinc-700/80 text-white"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 bg-zinc-950 text-zinc-100 text-sm font-mono overflow-x-auto">
            <code>{example.code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="text-sm text-zinc-500">
            {example.aiProvider ? (
              <span>
                Uses {example.aiProvider} API for decision making
              </span>
            ) : (
              <span>Pure algorithmic implementation - no AI API needed</span>
            )}
          </div>
          <div className="flex gap-2">
            {example.aiProvider && providerDocs[example.aiProvider] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(providerDocs[example.aiProvider!], "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {example.aiProvider} Docs
              </Button>
            )}
            <Button variant="default" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Code
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
