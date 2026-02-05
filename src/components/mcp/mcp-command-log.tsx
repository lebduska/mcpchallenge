"use client";

/**
 * MCPCommandLog - Terminal-style MCP command stream
 *
 * Dark terminal look with syntax highlighting.
 * Shows request/response pairs with animations.
 */

import { useRef, useEffect } from "react";
import { Terminal, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandLogEntry } from "./types";

interface MCPCommandLogProps {
  commands: CommandLogEntry[];
  maxHeight?: string;
  className?: string;
}

export function MCPCommandLog({
  commands,
  maxHeight = "400px",
  className,
}: MCPCommandLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new commands arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commands]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Extract text from MCP response content
  const formatResult = (obj: unknown): string | null => {
    if (!obj) return null;
    try {
      const result = obj as { content?: Array<{ type: string; text: string }> };
      if (result.content && Array.isArray(result.content)) {
        return result.content
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("\n");
      }
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  // Format request params as compact JSON
  const formatParams = (obj: unknown): string | null => {
    if (!obj) return null;
    try {
      return JSON.stringify(obj);
    } catch {
      return String(obj);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800",
        "shadow-lg dark:shadow-2xl shadow-black/10 dark:shadow-black/50",
        className
      )}
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500/80" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-600 dark:text-zinc-500 font-medium">MCP Stream</span>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-600 font-mono">{commands.length}</span>
      </div>

      {/* Command stream */}
      <div
        ref={scrollRef}
        style={{ maxHeight }}
        className="overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
      >
        {commands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <Terminal className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-500">Waiting for commands...</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">Connect your MCP client</p>
          </div>
        ) : (
          commands.map((cmd, i) => (
            <CommandEntry
              key={i}
              cmd={cmd}
              formatTime={formatTime}
              formatParams={formatParams}
              formatResult={formatResult}
              isNew={i === commands.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommandEntryProps {
  cmd: CommandLogEntry;
  formatTime: (timestamp: number) => string;
  formatParams: (obj: unknown) => string | null;
  formatResult: (obj: unknown) => string | null;
  isNew?: boolean;
}

function CommandEntry({
  cmd,
  formatTime,
  formatParams,
  formatResult,
  isNew,
}: CommandEntryProps) {
  const isRequest = cmd.type === "request";
  const hasError = Boolean(cmd.error);

  return (
    <div
      className={cn(
        "rounded-lg p-2.5 font-mono text-xs transition-all",
        isRequest
          ? "bg-blue-50 dark:bg-blue-950/40 border-l-2 border-blue-500"
          : hasError
          ? "bg-red-50 dark:bg-red-950/40 border-l-2 border-red-500"
          : "bg-emerald-50 dark:bg-emerald-950/40 border-l-2 border-emerald-500",
        isNew && "animate-in slide-in-from-bottom-2 fade-in duration-300",
        // Hover effect
        "hover:brightness-95 dark:hover:brightness-110 cursor-default"
      )}
    >
      {/* Header line */}
      <div className="flex items-center gap-2">
        {isRequest ? (
          <ChevronRight className="h-3 w-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
        ) : hasError ? (
          <AlertCircle className="h-3 w-3 text-red-500 dark:text-red-400 flex-shrink-0" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
        )}

        <span className="text-zinc-400 dark:text-zinc-600 tabular-nums">{formatTime(cmd.timestamp)}</span>

        {cmd.toolName && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
              isRequest
                ? "bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300"
                : hasError
                ? "bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-300"
                : "bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300"
            )}
          >
            {cmd.toolName}
          </span>
        )}

        {cmd.method && !cmd.toolName && (
          <span className="text-zinc-500 dark:text-zinc-500 font-medium">{cmd.method}</span>
        )}
      </div>

      {/* Content */}
      {isRequest && cmd.params != null && (
        <div className="mt-1.5 pl-5">
          <code className="text-zinc-500 dark:text-zinc-400 break-all text-[11px]">{formatParams(cmd.params)}</code>
        </div>
      )}

      {!isRequest && cmd.result != null && (
        <div className="mt-1.5 pl-5">
          <pre className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap break-words max-h-28 overflow-y-auto text-[11px] scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {formatResult(cmd.result)}
          </pre>
        </div>
      )}

      {hasError && (
        <div className="mt-1.5 pl-5">
          <span className="text-red-600 dark:text-red-400 font-medium">{cmd.error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline command display for smaller spaces
 */
interface CompactCommandProps {
  cmd: CommandLogEntry;
  className?: string;
}

export function CompactCommand({ cmd, className }: CompactCommandProps) {
  const isRequest = cmd.type === "request";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-xs",
        "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      {isRequest ? (
        <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
      ) : (
        <ChevronLeft className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      )}
      <span className={cn(isRequest ? "text-blue-700 dark:text-blue-300" : "text-emerald-700 dark:text-emerald-300")}>
        {cmd.toolName || cmd.method}
      </span>
    </div>
  );
}
