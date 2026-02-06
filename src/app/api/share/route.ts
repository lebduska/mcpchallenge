import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { shareLinks, replays } from "@/db/schema";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

/**
 * Generate a short code for sharing (8 characters, base62)
 */
function generateShortCode(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => chars[b % chars.length])
    .join("");
}

interface CreateShareBody {
  replayId: string;
  visibility?: "public" | "unlisted";
}

/**
 * POST /api/share
 * Create a share link for a replay
 */
export async function POST(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const session = await getSession();

  const body = (await request.json()) as CreateShareBody;

  if (!body.replayId) {
    return NextResponse.json(
      { error: "replayId is required" },
      { status: 400 }
    );
  }

  // Verify replay exists
  const replay = await db.query.replays.findFirst({
    where: eq(replays.id, body.replayId),
  });

  if (!replay) {
    return NextResponse.json(
      { error: "Replay not found" },
      { status: 404 }
    );
  }

  // Check if share link already exists for this replay
  const existingLink = await db.query.shareLinks.findFirst({
    where: eq(shareLinks.replayId, body.replayId),
  });

  if (existingLink) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mcpchallenge.org";
    return NextResponse.json({
      code: existingLink.id,
      url: `${baseUrl}/s/${existingLink.id}`,
      existing: true,
    });
  }

  // Generate unique short code
  let code = generateShortCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.query.shareLinks.findFirst({
      where: eq(shareLinks.id, code),
    });
    if (!existing) break;
    code = generateShortCode();
    attempts++;
  }

  // Create share link
  await db.insert(shareLinks).values({
    id: code,
    replayId: body.replayId,
    createdByUserId: session?.user?.id || null,
    visibility: body.visibility || "unlisted",
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mcpchallenge.org";

  return NextResponse.json({
    code,
    url: `${baseUrl}/s/${code}`,
    existing: false,
  });
}
