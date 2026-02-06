import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { replays } from "@/db/schema";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

interface CreateReplayBody {
  challengeId: string;
  levelId?: string;
  seed?: string;
  moves: unknown[];
  result?: {
    won?: boolean;
    moves?: number;
    pushes?: number;
    timeMs?: number;
    score?: number;
  };
  agentSnapshotJson?: string; // Agent identity snapshot (if MCP agent)
}

/**
 * POST /api/replays
 * Create a new replay
 */
export async function POST(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const session = await getSession();

  const body = (await request.json()) as CreateReplayBody;

  if (!body.challengeId || !body.moves) {
    return NextResponse.json(
      { error: "challengeId and moves are required" },
      { status: 400 }
    );
  }

  const replayId = crypto.randomUUID();

  await db.insert(replays).values({
    id: replayId,
    userId: session?.user?.id || null,
    challengeId: body.challengeId,
    levelId: body.levelId || null,
    seed: body.seed || null,
    movesJson: JSON.stringify(body.moves),
    resultJson: body.result ? JSON.stringify(body.result) : null,
    agentSnapshotJson: body.agentSnapshotJson || null,
  });

  return NextResponse.json({
    id: replayId,
    success: true,
  });
}
