"use client";

import { Bot, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentIdentity } from "./agent-chip";

export interface PvPPlayersState {
  white: AgentIdentity | null;
  black: AgentIdentity | null;
}

interface PvPAgentsProps {
  players: PvPPlayersState;
  currentTurn: "white" | "black";
  className?: string;
}

/**
 * Component showing both PvP players (white vs black)
 * Highlights whose turn it is
 */
export function PvPAgents({ players, currentTurn, className }: PvPAgentsProps) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50",
      className
    )}>
      {/* White player */}
      <PlayerSlot
        color="white"
        agent={players.white}
        isActive={currentTurn === "white"}
      />

      {/* VS divider */}
      <div className="flex flex-col items-center gap-1">
        <Swords className="h-4 w-4 text-zinc-500" />
        <span className="text-[10px] text-zinc-500 font-medium">VS</span>
      </div>

      {/* Black player */}
      <PlayerSlot
        color="black"
        agent={players.black}
        isActive={currentTurn === "black"}
      />
    </div>
  );
}

interface PlayerSlotProps {
  color: "white" | "black";
  agent: AgentIdentity | null;
  isActive: boolean;
}

function PlayerSlot({ color, agent, isActive }: PlayerSlotProps) {
  const isWhite = color === "white";

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all min-w-[140px]",
      isActive
        ? isWhite
          ? "bg-white/10 ring-2 ring-white/50"
          : "bg-zinc-700 ring-2 ring-zinc-500"
        : "opacity-60"
    )}>
      {/* Color indicator */}
      <div className={cn(
        "w-4 h-4 rounded-full border flex-shrink-0",
        isWhite
          ? "bg-white border-zinc-400"
          : "bg-zinc-900 border-zinc-600"
      )} />

      {/* Agent info */}
      <div className="flex-1 min-w-0">
        {agent ? (
          <div className="flex items-center gap-1.5">
            <Bot className="h-3 w-3 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium text-white truncate">
              {agent.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-zinc-500">Waiting...</span>
        )}

        {agent && (
          <span className="text-xs text-zinc-400 truncate block">
            {agent.model}
          </span>
        )}
      </div>

      {/* Turn indicator */}
      {isActive && (
        <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex-shrink-0">
          Turn
        </Badge>
      )}
    </div>
  );
}

/**
 * Waiting state when no players have connected yet
 */
export function PvPWaiting({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-sm text-zinc-400">Waiting for players to connect...</span>
      </div>
      <p className="text-xs text-zinc-500 text-center">
        Configure both MCP clients with different player nonces to start the game.
      </p>
    </div>
  );
}
