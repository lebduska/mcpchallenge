"use client";

/**
 * ClientSelector - URL-first MCP connection setup
 *
 * Shows the universal MCP URL prominently, with quick setup
 * shortcuts for popular clients.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, ExternalLink, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ClientFormat = "claude" | "cursor" | "vscode" | "generic";

const LAST_USED_KEY = "mcp-last-used-client";

interface ClientOption {
  id: ClientFormat;
  name: string;
  configTemplate: (url: string) => string;
  hint: string;
}

const clients: ClientOption[] = [
  {
    id: "claude",
    name: "Claude",
    hint: "Paste in claude_desktop_config.json",
    configTemplate: (url) => `{
  "mcpServers": {
    "game": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-proxy", "${url}"]
    }
  }
}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    hint: "Settings → MCP Servers",
    configTemplate: (url) => `{
  "mcp": {
    "servers": {
      "game": { "url": "${url}", "transport": "http" }
    }
  }
}`,
  },
  {
    id: "vscode",
    name: "VS Code",
    hint: "With Copilot MCP extension",
    configTemplate: (url) => `{
  "mcp": {
    "servers": {
      "game": { "url": "${url}" }
    }
  }
}`,
  },
  {
    id: "generic",
    name: "Other",
    hint: "Any MCP-compatible client",
    configTemplate: (url) => url,
  },
];

interface ClientSelectorProps {
  mcpUrl: string;
  className?: string;
}

export function ClientSelector({ mcpUrl, className }: ClientSelectorProps) {
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientFormat | null>(null);
  const [lastUsedClient, setLastUsedClient] = useState<ClientFormat | null>(null);

  // Load last used client from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LAST_USED_KEY) as ClientFormat | null;
    if (stored && clients.some((c) => c.id === stored)) {
      setLastUsedClient(stored);
    }
  }, []);

  // Sort clients with last used first
  const sortedClients = useMemo(() => {
    if (!lastUsedClient) return clients;
    return [...clients].sort((a, b) => {
      if (a.id === lastUsedClient) return -1;
      if (b.id === lastUsedClient) return 1;
      return 0;
    });
  }, [lastUsedClient]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyConfig = async (client: ClientOption) => {
    await navigator.clipboard.writeText(client.configTemplate(mcpUrl));
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
    // Remember this client for next time
    localStorage.setItem(LAST_USED_KEY, client.id);
    setLastUsedClient(client.id);
  };

  const activeClient = clients.find((c) => c.id === selectedClient);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary: MCP URL */}
      <div className="p-4 rounded-xl bg-zinc-900 dark:bg-zinc-950 border border-zinc-800">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-zinc-400">MCP Server URL</span>
          <span className="text-xs text-zinc-500">Works with any client</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-emerald-400 font-mono truncate">
            {mcpUrl}
          </code>
          <Button
            size="sm"
            variant="ghost"
            onClick={copyUrl}
            className={cn(
              "h-8 px-3 shrink-0",
              copied
                ? "text-emerald-400 hover:text-emerald-400"
                : "text-zinc-400 hover:text-white"
            )}
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
      </div>

      {/* Secondary: Quick setup for popular clients */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-zinc-500">Quick setup for:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedClients.map((client) => {
            const isLastUsed = client.id === lastUsedClient;
            return (
              <button
                key={client.id}
                onClick={() =>
                  setSelectedClient(selectedClient === client.id ? null : client.id)
                }
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1",
                  selectedClient === client.id
                    ? "bg-blue-500 text-white"
                    : isLastUsed
                      ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 ring-1 ring-blue-300 dark:ring-blue-500/40"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {isLastUsed && <Clock className="h-3 w-3" />}
                {client.name}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    selectedClient === client.id && "rotate-180"
                  )}
                />
              </button>
            );
          })}
          <a
            href="https://modelcontextprotocol.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-500 flex items-center gap-1"
          >
            Docs
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Expandable config panel */}
      <AnimatePresence>
        {activeClient && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {activeClient.name} config
                </span>
                <span className="text-xs text-zinc-500">{activeClient.hint}</span>
              </div>
              <pre className="p-3 rounded-lg bg-zinc-900 dark:bg-zinc-950 text-xs text-zinc-300 font-mono overflow-x-auto">
                {activeClient.configTemplate(mcpUrl)}
              </pre>
              <Button
                size="sm"
                onClick={() => copyConfig(activeClient)}
                className={cn(
                  "mt-3 w-full",
                  copiedConfig && "bg-emerald-600 hover:bg-emerald-600"
                )}
              >
                {copiedConfig ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Config copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy {activeClient.name} config
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
