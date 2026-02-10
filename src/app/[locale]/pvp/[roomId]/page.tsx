"use client";

export const runtime = "edge";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import {
  Swords,
  ArrowLeft,
  Users,
  Copy,
  Check,
  Loader2,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRoomId } from "@/lib/room-name";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface RoomInfo {
  matchId: string;
  roomId: string;
  gameType: "chess" | "tic-tac-toe";
  result: string;
  hasWhite: boolean;
  hasBlack: boolean;
  isFull: boolean;
  startedAt: string;
}

interface JoinResult {
  success: boolean;
  matchId: string;
  roomId: string;
  gameType: string;
  color: "white" | "black";
  playerNonce: string;
  sessionNonce: string;
  isReconnect?: boolean;
}

const GAME_ICONS: Record<string, string> = {
  chess: "♟️",
  "tic-tac-toe": "⭕",
};

const GAME_NAMES: Record<string, string> = {
  chess: "Chess",
  "tic-tac-toe": "Tic-Tac-Toe",
};

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function PvPRoomPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [joinResult, setJoinResult] = useState<JoinResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  // Resolve params
  useEffect(() => {
    params.then((p) => setRoomId(p.roomId));
  }, [params]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated" && roomId) {
      router.push(`/auth/signin?callbackUrl=/pvp/${roomId}`);
    }
  }, [status, roomId, router]);

  // Fetch room info
  useEffect(() => {
    if (!roomId) return;

    async function fetchRoomInfo() {
      try {
        const res = await fetch(`/api/pvp/join/${roomId}`);
        if (res.ok) {
          const data = await res.json() as RoomInfo;
          setRoomInfo(data);
        } else {
          const errorData = await res.json() as { error?: string };
          setError(errorData.error || "Room not found");
        }
      } catch {
        setError("Failed to load room info");
      } finally {
        setLoading(false);
      }
    }

    fetchRoomInfo();
  }, [roomId]);

  // Join the match
  const joinMatch = useCallback(async () => {
    if (!roomId || !session?.user) return;

    setJoining(true);
    try {
      const res = await fetch(`/api/pvp/join/${roomId}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json() as JoinResult;
        setJoinResult(data);
      } else {
        const errorData = await res.json() as { error?: string };
        setError(errorData.error || "Failed to join match");
      }
    } catch {
      setError("Failed to join match");
    } finally {
      setJoining(false);
    }
  }, [roomId, session]);

  // Copy invite link
  const copyInviteLink = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">
              {error}
            </h2>
            <p className="text-zinc-500 mb-6">
              The match may have ended or the room does not exist.
            </p>
            <Link href="/pvp">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to PvP Lobby
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (!roomInfo) {
    return null;
  }

  const roomDisplay = formatRoomId(roomInfo.roomId);
  const gameType = roomInfo.gameType === "tic-tac-toe" ? "tictactoe" : roomInfo.gameType;

  // Match completed
  if (roomInfo.result !== "pending") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">
              Match Completed
            </h2>
            <p className="text-zinc-500 mb-6">
              Result: {roomInfo.result === "draw" ? "Draw" : `${roomInfo.result} wins`}
            </p>
            <Link href="/pvp">
              <Button>
                <Swords className="h-4 w-4 mr-2" />
                Play Again
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/pvp">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Lobby
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{GAME_ICONS[roomInfo.gameType]}</span>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {GAME_NAMES[roomInfo.gameType]} - PvP
                </h1>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span>{roomDisplay?.name}</span>
                  <code className="text-xs opacity-60">({roomDisplay?.shortId})</code>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                roomInfo.isFull
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              )}
            >
              <Users className="h-3 w-3 mr-1" />
              {roomInfo.isFull ? "2/2 Players" : "1/2 Players"}
            </Badge>
            <Button variant="outline" size="sm" onClick={copyInviteLink}>
              {copied ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game board */}
          <div className="lg:col-span-3">
            <LiveGameBoard
              gameType={gameType as "chess" | "tictactoe"}
              roomId={roomInfo.roomId}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Join card - only show if not joined and room not full */}
            {!joinResult && !roomInfo.isFull && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-zinc-900 dark:text-white">
                  Join Match
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Waiting for opponent to join...
                </p>
                <Button
                  className="w-full"
                  onClick={joinMatch}
                  disabled={joining}
                >
                  {joining ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Swords className="h-4 w-4 mr-2" />
                  )}
                  Join as Player 2
                </Button>
              </Card>
            )}

            {/* Joined info */}
            {joinResult && (
              <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-700 dark:text-green-300">
                    Joined!
                  </h3>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  You are playing as <strong>{joinResult.color}</strong>
                </p>
              </Card>
            )}

            {/* Match info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 text-zinc-900 dark:text-white">
                Match Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Game</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {GAME_NAMES[roomInfo.gameType]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Status</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      roomInfo.isFull
                        ? "border-green-300 text-green-600"
                        : "border-amber-300 text-amber-600"
                    )}
                  >
                    {roomInfo.isFull ? "In Progress" : "Waiting"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Players</span>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      roomInfo.hasWhite ? "bg-emerald-500" : "bg-zinc-300"
                    )} />
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      roomInfo.hasBlack ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300"
                    )} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Instructions */}
            <Card className="p-4 bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-semibold mb-3 text-zinc-900 dark:text-white">
                How to Play
              </h3>
              <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">1</span>
                  <span>Both players connect their MCP agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">2</span>
                  <span>Use the MCP URL shown above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">3</span>
                  <span>Your AI makes moves, watch the battle!</span>
                </li>
              </ol>
            </Card>
          </div>
        </div>

        {/* Achievement notification */}
        {unlockedAchievements.length > 0 && (
          <AchievementToast
            achievements={unlockedAchievements}
            onClose={() => setUnlockedAchievements([])}
          />
        )}
      </div>
    </div>
  );
}
