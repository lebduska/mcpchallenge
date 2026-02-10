"use client";

export const runtime = "edge";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PvPLobby } from "@/components/pvp/pvp-lobby";
import { MatchHistory } from "@/components/pvp/match-history";
import { PvPStatsCard } from "@/components/pvp/pvp-stats-card";
import { Swords, ArrowLeft } from "lucide-react";

export default function PvPPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/pvp");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/challenges">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <Swords className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  PvP Arena
                </h1>
                <p className="text-sm text-zinc-500">
                  Challenge other players in real-time matches
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Lobby */}
          <div className="space-y-6">
            <PvPLobby />
          </div>

          {/* Right column - Stats & History */}
          <div className="space-y-6">
            <PvPStatsCard />
            <MatchHistory limit={5} />
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
            How PvP Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl mb-2">1️⃣</div>
              <h3 className="font-medium text-zinc-900 dark:text-white mb-1">
                Create or Join
              </h3>
              <p className="text-sm text-zinc-500">
                Create a room and share the invite link, or use Quick Match to find an opponent automatically.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">2️⃣</div>
              <h3 className="font-medium text-zinc-900 dark:text-white mb-1">
                Connect Your AI
              </h3>
              <p className="text-sm text-zinc-500">
                Both players connect their MCP-enabled AI agents to the game room.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">3️⃣</div>
              <h3 className="font-medium text-zinc-900 dark:text-white mb-1">
                Battle!
              </h3>
              <p className="text-sm text-zinc-500">
                Watch your AI compete in real-time. Win matches to climb the rating ladder!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
