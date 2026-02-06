"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AgentIdentity {
  name: string;
  model: string;
  client: string;
  strategy?: string;
  repo?: string;
  envVars?: string[];
  share: "private" | "unlisted" | "public";
}

interface AgentChipProps {
  identity: AgentIdentity | null;
  className?: string;
}

/**
 * Compact chip showing agent identity status
 * - Shows "Agent: Unknown" when no agent is identified
 * - Shows "AgentName (model)" when identified
 * - Clicking opens a panel with more details
 */
export function AgentChip({ identity, className }: AgentChipProps) {
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPanel(false);
      }
    }

    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPanel]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowPanel(false);
      }
    }

    if (showPanel) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showPanel]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={() => setShowPanel(!showPanel)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200",
          "bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/50",
          "text-sm font-medium",
          identity ? "text-emerald-400" : "text-zinc-400"
        )}
      >
        <Bot className="h-4 w-4" />
        <span className="transition-all duration-200 whitespace-nowrap">
          {identity ? (
            <>
              {identity.name}
              <span className="text-zinc-500 ml-1">({identity.model})</span>
            </>
          ) : (
            "Agent: Unknown"
          )}
        </span>
      </button>

      {/* Detail panel */}
      {showPanel && identity && (
        <AgentPanel
          ref={panelRef}
          identity={identity}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}

interface AgentPanelProps {
  identity: AgentIdentity;
  onClose: () => void;
}

const AgentPanel = ({ identity, onClose, ref }: AgentPanelProps & { ref: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full right-0 mt-2 w-80 p-4 z-50",
        "bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Bot className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{identity.name}</h4>
            <p className="text-sm text-zinc-400">{identity.model}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-700 rounded transition-colors"
        >
          <X className="h-4 w-4 text-zinc-400" />
        </button>
      </div>

      {/* Details */}
      <div className="space-y-3">
        {/* Client */}
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wide">Client</span>
          <p className="text-sm text-zinc-300">{identity.client}</p>
        </div>

        {/* Strategy */}
        {identity.strategy && (
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Strategy</span>
            <p className="text-sm text-zinc-300">{identity.strategy}</p>
          </div>
        )}

        {/* Repository */}
        {identity.repo && (
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Repository</span>
            <a
              href={identity.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 hover:underline"
            >
              {identity.repo.replace(/^https?:\/\//, "").slice(0, 40)}
              {identity.repo.length > 40 && "..."}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Environment Variables */}
        {identity.envVars && identity.envVars.length > 0 && (
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Environment</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {identity.envVars.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="text-xs font-mono bg-zinc-900"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share Mode */}
        <div className="pt-2 border-t border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Sharing</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                identity.share === "public" && "border-emerald-500 text-emerald-400",
                identity.share === "unlisted" && "border-amber-500 text-amber-400",
                identity.share === "private" && "border-zinc-600 text-zinc-400"
              )}
            >
              {identity.share}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
