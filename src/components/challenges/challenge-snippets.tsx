"use client";

import { useState, useEffect } from "react";
import { Check, Copy, ExternalLink, Code2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Snippet {
  id: string;
  title: string;
  description: string | null;
  language: string;
  code: string;
  clientType: string | null;
  isCurated: boolean;
}

interface ChallengeSnippetsProps {
  challengeId: string;
  className?: string;
}

// Client type configurations
const clientTypes = [
  { id: "claude-code", label: "Claude Code", icon: "claude" },
  { id: "cursor", label: "Cursor", icon: "cursor" },
  { id: "windsurf", label: "Windsurf", icon: "windsurf" },
  { id: "generic", label: "Generic MCP", icon: "generic" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 mr-1 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </>
      )}
    </Button>
  );
}

function SnippetCard({ snippet }: { snippet: Snippet }) {
  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm text-zinc-900 dark:text-white">
            {snippet.title}
          </h4>
          {snippet.isCurated && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 px-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            >
              Official
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            {snippet.language}
          </Badge>
        </div>
        <CopyButton text={snippet.code} />
      </div>
      {snippet.description && (
        <div className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/50">
          {snippet.description}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-xs font-mono bg-zinc-950 text-zinc-100">
        <code>{snippet.code}</code>
      </pre>
    </Card>
  );
}

export function ChallengeSnippets({ challengeId, className }: ChallengeSnippetsProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClient, setActiveClient] = useState("claude-code");

  useEffect(() => {
    async function fetchSnippets() {
      setLoading(true);
      try {
        const res = await fetch(`/api/challenges/${challengeId}/snippets?curatedOnly=true`);
        if (res.ok) {
          const data = await res.json() as { snippets: Snippet[] };
          setSnippets(data.snippets);
        }
      } catch (err) {
        console.error("Failed to fetch snippets:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSnippets();
  }, [challengeId]);

  // Get snippets for a specific client type
  const getSnippetsForClient = (clientId: string) => {
    return snippets.filter(
      (s) => s.clientType === clientId || s.clientType === null || s.clientType === "generic"
    );
  };

  // Filter snippets by active client type
  const filteredSnippets = getSnippetsForClient(activeClient);

  // Only show tabs that have snippets
  const availableClients = clientTypes.filter(
    (client) => getSnippetsForClient(client.id).length > 0
  );

  // Set active client to first available if current has no snippets
  const effectiveClient = availableClients.find(c => c.id === activeClient)
    ? activeClient
    : availableClients[0]?.id || "claude-code";

  if (loading) {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <Code2 className="h-10 w-10 mx-auto mb-3 text-zinc-400" />
        <h3 className="font-medium text-zinc-900 dark:text-white mb-1">
          No Code Snippets Yet
        </h3>
        <p className="text-sm text-zinc-500">
          Ready-to-use code snippets for this challenge are coming soon.
        </p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Quick Start Code
        </h3>
        <a
          href="https://mcpchallenge.org/docs/getting-started"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Setup Guide
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <Tabs value={effectiveClient} onValueChange={setActiveClient}>
        <TabsList className="h-8 p-0.5 bg-zinc-100 dark:bg-zinc-900">
          {availableClients.map((client) => (
            <TabsTrigger
              key={client.id}
              value={client.id}
              className="h-7 px-3 text-xs font-medium rounded"
            >
              {client.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={effectiveClient} className="mt-4 space-y-4">
          {getSnippetsForClient(effectiveClient).map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
