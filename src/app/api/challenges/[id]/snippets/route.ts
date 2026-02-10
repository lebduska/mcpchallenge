import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { codeSnippets, users } from "@/db/schema";
import { eq, and, desc, asc, or, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface PageProps {
  params: Promise<{ id: string }>;
}

// GET /api/challenges/[id]/snippets - List snippets for a challenge
export async function GET(request: NextRequest, { params }: PageProps) {
  const { id: challengeId } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { searchParams } = new URL(request.url);

  const clientType = searchParams.get("clientType"); // "claude-code" | "cursor" | "windsurf" | "generic"
  const curatedOnly = searchParams.get("curatedOnly") === "true";

  // Build conditions
  const conditions = [
    eq(codeSnippets.challengeId, challengeId),
    eq(codeSnippets.isPublic, true),
  ];

  if (clientType) {
    // Match specific clientType OR generic (null)
    conditions.push(
      or(eq(codeSnippets.clientType, clientType), isNull(codeSnippets.clientType)) as ReturnType<typeof eq>
    );
  }

  if (curatedOnly) {
    conditions.push(eq(codeSnippets.isCurated, true));
  }

  const snippets = await db
    .select({
      id: codeSnippets.id,
      title: codeSnippets.title,
      description: codeSnippets.description,
      language: codeSnippets.language,
      code: codeSnippets.code,
      clientType: codeSnippets.clientType,
      isCurated: codeSnippets.isCurated,
      sortOrder: codeSnippets.sortOrder,
      viewCount: codeSnippets.viewCount,
      createdAt: codeSnippets.createdAt,
      userId: codeSnippets.userId,
      userName: users.name,
      userImage: users.image,
      userUsername: users.username,
    })
    .from(codeSnippets)
    .leftJoin(users, eq(codeSnippets.userId, users.id))
    .where(and(...conditions))
    .orderBy(
      desc(codeSnippets.isCurated), // Curated first
      asc(codeSnippets.sortOrder),  // Then by sort order
      desc(codeSnippets.createdAt)  // Then by date
    );

  return NextResponse.json({
    challengeId,
    snippets: snippets.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      language: s.language,
      code: s.code,
      clientType: s.clientType,
      isCurated: s.isCurated,
      sortOrder: s.sortOrder,
      viewCount: s.viewCount,
      createdAt: s.createdAt,
      author: s.userId ? {
        id: s.userId,
        name: s.userName,
        image: s.userImage,
        username: s.userUsername,
      } : null,
    })),
  });
}
