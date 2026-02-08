import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { codeSnippets, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

// GET /api/snippets/[id] - Get single snippet
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const [snippet] = await db
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
    .where(eq(codeSnippets.id, id))
    .limit(1);

  if (!snippet) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }

  // Increment view count (non-blocking)
  db.update(codeSnippets)
    .set({ viewCount: sql`${codeSnippets.viewCount} + 1` })
    .where(eq(codeSnippets.id, id))
    .run();

  return NextResponse.json({
    ...snippet,
    author: snippet.userId ? {
      id: snippet.userId,
      name: snippet.userName,
      image: snippet.userImage,
      username: snippet.userUsername,
    } : null,
  });
}

// DELETE /api/snippets/[id] - Delete snippet
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const [snippet] = await db
    .select()
    .from(codeSnippets)
    .where(eq(codeSnippets.id, id))
    .limit(1);

  if (!snippet) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }

  if (snippet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(codeSnippets).where(eq(codeSnippets.id, id));

  return NextResponse.json({ success: true });
}
