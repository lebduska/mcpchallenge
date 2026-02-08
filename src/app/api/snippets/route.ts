import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { codeSnippets, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

// GET /api/snippets - List snippets
export async function GET(request: NextRequest) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { searchParams } = new URL(request.url);

  const challengeId = searchParams.get("challengeId");
  const userId = searchParams.get("userId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const query = db
    .select({
      id: codeSnippets.id,
      title: codeSnippets.title,
      description: codeSnippets.description,
      language: codeSnippets.language,
      code: codeSnippets.code,
      challengeId: codeSnippets.challengeId,
      viewCount: codeSnippets.viewCount,
      createdAt: codeSnippets.createdAt,
      userId: codeSnippets.userId,
      userName: users.name,
      userImage: users.image,
      userUsername: users.username,
    })
    .from(codeSnippets)
    .leftJoin(users, eq(codeSnippets.userId, users.id))
    .where(eq(codeSnippets.isPublic, true))
    .orderBy(desc(codeSnippets.createdAt))
    .limit(limit)
    .offset(offset);

  const snippets = await query;

  return NextResponse.json({
    snippets: snippets.map((s) => ({
      ...s,
      author: s.userId ? {
        id: s.userId,
        name: s.userName,
        image: s.userImage,
        username: s.userUsername,
      } : null,
    })),
  });
}

// POST /api/snippets - Create snippet
export async function POST(request: NextRequest) {
  const session = await getSession();

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const body = await request.json() as {
    title?: string;
    description?: string;
    language?: string;
    code?: string;
    challengeId?: string;
    isPublic?: boolean;
  };
  const { title, description, language, code, challengeId, isPublic } = body;

  if (!title || !code) {
    return NextResponse.json(
      { error: "Title and code are required" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();

  await db.insert(codeSnippets).values({
    id,
    userId: session?.user?.id || null,
    title,
    description: description || null,
    language: language || "json",
    code,
    challengeId: challengeId || null,
    isPublic: isPublic !== false,
  });

  return NextResponse.json({
    id,
    url: `/snippets/${id}`,
  });
}
