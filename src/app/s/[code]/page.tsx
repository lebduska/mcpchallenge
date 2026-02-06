import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { shareLinks, replays, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Calendar, Trophy, Clock, Move, Bot, Github, ExternalLink } from "lucide-react";

export const runtime = "edge";

interface PageProps {
  params: Promise<{ code: string }>;
}

async function getShareData(code: string) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const link = await db.query.shareLinks.findFirst({
    where: eq(shareLinks.id, code),
  });

  if (!link) return null;

  // Check if expired
  if (link.expiresAt && link.expiresAt < new Date()) {
    return null;
  }

  const replay = await db.query.replays.findFirst({
    where: eq(replays.id, link.replayId),
  });

  if (!replay) return null;

  let user = null;
  if (replay.userId) {
    user = await db.query.users.findFirst({
      where: eq(users.id, replay.userId),
      columns: {
        id: true,
        username: true,
        name: true,
        image: true,
      },
    });
  }

  return {
    link,
    replay,
    user,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const data = await getShareData(code);

  if (!data) {
    return {
      title: "Replay Not Found",
    };
  }

  const result = data.replay.resultJson ? JSON.parse(data.replay.resultJson) : null;
  const challengeName = data.replay.challengeId.charAt(0).toUpperCase() + data.replay.challengeId.slice(1);
  const userName = data.user?.name || data.user?.username || "Anonymous";

  return {
    title: `${challengeName} Replay by ${userName} | MCP Challenge`,
    description: result?.won
      ? `Watch ${userName}'s winning replay of ${challengeName} level ${data.replay.levelId || ""}!`
      : `Watch ${userName}'s ${challengeName} replay.`,
    openGraph: {
      title: `${challengeName} Replay`,
      description: `Level ${data.replay.levelId || "?"} • ${result?.moves || "?"} moves`,
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { code } = await params;
  const data = await getShareData(code);

  if (!data) {
    notFound();
  }

  const { replay, user } = data;
  const result = replay.resultJson ? JSON.parse(replay.resultJson) : null;
  const moves = JSON.parse(replay.movesJson);
  const challengeName = replay.challengeId.charAt(0).toUpperCase() + replay.challengeId.slice(1);

  // Parse agent snapshot if available
  const agentSnapshot = replay.agentSnapshotJson
    ? JSON.parse(replay.agentSnapshotJson) as {
        schemaVersion: number;
        identity: {
          name: string;
          model: string;
          client: string;
          strategy?: string;
          repo?: string;
          envVars?: string[];
          share: "private" | "unlisted" | "public";
        };
        identifiedAt: number;
      }
    : null;

  // Only show agent info if share mode allows it
  const showAgent = agentSnapshot &&
    (agentSnapshot.identity.share === "unlisted" || agentSnapshot.identity.share === "public");

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/challenges">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Challenges
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 space-y-6">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{challengeName} Replay</h1>
              {replay.levelId && (
                <p className="text-zinc-400 mt-1">Level {replay.levelId}</p>
              )}
            </div>
            {result?.won && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                <Trophy className="w-3 h-3 mr-1" />
                Victory
              </Badge>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                <User className="w-6 h-6 text-zinc-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-white">
                {user?.name || user?.username || "Anonymous Player"}
              </p>
              {user?.username && (
                <Link
                  href={`/profile/${user.username}`}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  @{user.username}
                </Link>
              )}
            </div>
          </div>

          {/* Agent Info (if MCP agent) */}
          {showAgent && agentSnapshot && (
            <div className="p-4 bg-zinc-900/50 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white flex items-center gap-2">
                    {agentSnapshot.identity.name}
                    <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                      {agentSnapshot.identity.model}
                    </Badge>
                  </p>
                  <p className="text-sm text-zinc-400">{agentSnapshot.identity.client}</p>
                </div>
              </div>
              {agentSnapshot.identity.strategy && (
                <p className="mt-3 text-sm text-zinc-300 bg-zinc-800/50 rounded p-2">
                  {agentSnapshot.identity.strategy}
                </p>
              )}
              {agentSnapshot.identity.repo && (
                <a
                  href={agentSnapshot.identity.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 hover:underline"
                >
                  <Github className="w-4 h-4" />
                  Repository
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {agentSnapshot.identity.envVars && agentSnapshot.identity.envVars.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {agentSnapshot.identity.envVars.map((name) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="text-xs font-mono bg-zinc-800/50"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {result?.moves !== undefined && (
              <div className="p-4 bg-zinc-900/50 rounded-lg text-center">
                <Move className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{result.moves}</p>
                <p className="text-xs text-zinc-400">Moves</p>
              </div>
            )}
            {result?.pushes !== undefined && (
              <div className="p-4 bg-zinc-900/50 rounded-lg text-center">
                <Move className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{result.pushes}</p>
                <p className="text-xs text-zinc-400">Pushes</p>
              </div>
            )}
            {result?.timeMs !== undefined && (
              <div className="p-4 bg-zinc-900/50 rounded-lg text-center">
                <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {(result.timeMs / 1000).toFixed(1)}s
                </p>
                <p className="text-xs text-zinc-400">Time</p>
              </div>
            )}
            <div className="p-4 bg-zinc-900/50 rounded-lg text-center">
              <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-lg font-medium text-white">
                {replay.createdAt
                  ? new Date(replay.createdAt).toLocaleDateString()
                  : "Unknown"}
              </p>
              <p className="text-xs text-zinc-400">Date</p>
            </div>
          </div>

          {/* Moves List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-400">Move History ({moves.length} moves)</h3>
            <div className="p-4 bg-zinc-900/50 rounded-lg max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {moves.slice(0, 100).map((move: unknown, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-zinc-800 rounded text-zinc-300"
                  >
                    {typeof move === "string" ? move : JSON.stringify(move)}
                  </span>
                ))}
                {moves.length > 100 && (
                  <span className="px-2 py-0.5 text-xs text-zinc-500">
                    +{moves.length - 100} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-zinc-700">
            <Link href={`/challenges/${replay.challengeId}`}>
              <Button className="w-full">
                Play {challengeName}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
