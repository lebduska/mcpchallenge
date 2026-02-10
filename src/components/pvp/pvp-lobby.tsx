"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Swords,
  Users,
  Clock,
  Share2,
  Copy,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PvPLobbyProps {
  className?: string;
}

const GAME_TYPES = [
  {
    id: "chess",
    name: "Chess",
    icon: "♟️",
    description: "Classic chess battle",
    estimatedTime: "10-30 min",
  },
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    icon: "⭕",
    description: "Quick strategy game",
    estimatedTime: "1-3 min",
  },
];

export function PvPLobby({ className }: PvPLobbyProps) {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "create" | "matchmaking">("select");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [queueStatus, setQueueStatus] = useState<{
    inQueue: boolean;
    waitTimeMs?: number;
    matched?: boolean;
    roomId?: string;
  } | null>(null);

  async function createRoom(gameType: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/pvp/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType }),
      });

      if (res.ok) {
        const data = await res.json() as {
          roomId: string;
          inviteUrl: string;
        };
        setInviteUrl(data.inviteUrl);
        setMode("create");
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setLoading(false);
    }
  }

  async function joinMatchmaking(gameType: string) {
    setLoading(true);
    setMode("matchmaking");

    try {
      const res = await fetch("/api/matchmaking/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType }),
      });

      if (res.ok) {
        const data = await res.json() as {
          status: string;
          roomId?: string;
          matched?: boolean;
        };

        if (data.status === "matched" && data.roomId) {
          router.push(`/pvp/${data.roomId}`);
          return;
        }

        // Start polling for match
        pollForMatch();
      }
    } catch (error) {
      console.error("Failed to join matchmaking:", error);
      setMode("select");
    } finally {
      setLoading(false);
    }
  }

  async function pollForMatch() {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/matchmaking/queue");
        if (res.ok) {
          const data = await res.json() as {
            inQueue: boolean;
            matched?: boolean;
            roomId?: string;
            waitTimeMs?: number;
          };

          setQueueStatus(data);

          if (data.matched && data.roomId) {
            clearInterval(pollInterval);
            router.push(`/pvp/${data.roomId}`);
          }

          if (!data.inQueue && !data.matched) {
            clearInterval(pollInterval);
            setMode("select");
          }
        }
      } catch {
        // Continue polling
      }
    }, 2000);

    // Clean up on unmount
    return () => clearInterval(pollInterval);
  }

  async function cancelMatchmaking() {
    try {
      await fetch("/api/matchmaking/queue", { method: "DELETE" });
      setMode("select");
      setQueueStatus(null);
    } catch (error) {
      console.error("Failed to cancel matchmaking:", error);
    }
  }

  async function copyInviteUrl() {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  function formatWaitTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  if (mode === "matchmaking") {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Finding Opponent...</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Looking for a player with similar rating
          </p>
          {queueStatus?.waitTimeMs && (
            <p className="text-sm text-zinc-400 mb-4">
              Wait time: {formatWaitTime(queueStatus.waitTimeMs)}
            </p>
          )}
          <Button variant="outline" onClick={cancelMatchmaking}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  if (mode === "create" && inviteUrl) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-lg bg-green-100 dark:bg-green-900/50">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Room Created!</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Share this link with your opponent
          </p>

          <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-4">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-transparent text-sm truncate"
            />
            <Button size="sm" variant="ghost" onClick={copyInviteUrl}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setMode("select");
                setInviteUrl(null);
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push(inviteUrl.replace(window.location.origin, ""))}
            >
              Enter Room
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
          <Swords className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            PvP Multiplayer
          </h3>
          <p className="text-sm text-zinc-500">
            Challenge other players
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {GAME_TYPES.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={cn(
              "w-full p-4 rounded-lg border-2 transition-all text-left",
              selectedGame === game.id
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{game.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-zinc-900 dark:text-white">
                  {game.name}
                </div>
                <div className="text-sm text-zinc-500">{game.description}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="h-3 w-3" />
                {game.estimatedTime}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          disabled={!selectedGame || loading}
          onClick={() => selectedGame && createRoom(selectedGame)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4 mr-2" />
          )}
          Create Room
        </Button>
        <Button
          disabled={!selectedGame || loading}
          onClick={() => selectedGame && joinMatchmaking(selectedGame)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Users className="h-4 w-4 mr-2" />
          )}
          Quick Match
        </Button>
      </div>
    </Card>
  );
}
