"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Terminal } from "lucide-react";
import type { CommandLogEntry } from "./types";

interface MCPCommandLogProps {
  commands: CommandLogEntry[];
  maxHeight?: string;
}

export function MCPCommandLog({
  commands,
  maxHeight = "400px",
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

  const formatJson = (obj: unknown): string | null => {
    if (!obj) return null;
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          MCP Commands
          <Badge variant="secondary" className="ml-auto">
            {commands.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          style={{ maxHeight }}
          className="px-4 pb-4 overflow-y-auto"
          ref={scrollRef}
        >
          {commands.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for MCP commands...</p>
              <p className="text-xs mt-1">
                Connect your MCP client to see commands here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {commands.map((cmd, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 font-mono text-xs ${
                    cmd.type === "request"
                      ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                      : cmd.error
                        ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                        : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    {cmd.type === "request" ? (
                      <ArrowRight className="h-3 w-3 text-blue-500" />
                    ) : (
                      <ArrowLeft className="h-3 w-3 text-green-500" />
                    )}
                    <span className="text-zinc-400">
                      {formatTime(cmd.timestamp)}
                    </span>
                    {cmd.toolName && (
                      <Badge
                        variant={cmd.type === "request" ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {cmd.toolName}
                      </Badge>
                    )}
                    {cmd.method && !cmd.toolName && (
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {cmd.method}
                      </span>
                    )}
                    {cmd.error && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Error
                      </Badge>
                    )}
                  </div>

                  {cmd.type === "request" && cmd.params ? (
                    <pre className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all overflow-hidden">
                      {formatJson(cmd.params)}
                    </pre>
                  ) : null}
                  {cmd.type === "response" && cmd.result ? (
                    <pre className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all overflow-hidden max-h-40 overflow-y-auto">
                      {formatJson(cmd.result)}
                    </pre>
                  ) : null}
                  {cmd.error ? (
                    <p className="text-red-600 dark:text-red-400">{cmd.error}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
