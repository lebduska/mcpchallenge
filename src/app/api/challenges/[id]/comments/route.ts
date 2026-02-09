import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { challengeComments, users, commentLikes } from "@/db/schema";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  RateLimitPresets,
  rateLimitExceededResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";

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

// GET /api/challenges/[id]/comments - List comments for a challenge
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: challengeId } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const session = await getSession();

  // Get top-level comments first
  const comments = await db
    .select({
      id: challengeComments.id,
      content: challengeComments.content,
      isTip: challengeComments.isTip,
      likeCount: challengeComments.likeCount,
      parentId: challengeComments.parentId,
      createdAt: challengeComments.createdAt,
      userId: challengeComments.userId,
      userName: users.name,
      userImage: users.image,
      userUsername: users.username,
    })
    .from(challengeComments)
    .leftJoin(users, eq(challengeComments.userId, users.id))
    .where(eq(challengeComments.challengeId, challengeId))
    .orderBy(desc(challengeComments.isTip), desc(challengeComments.likeCount), desc(challengeComments.createdAt));

  // Get user's likes if authenticated
  let userLikes: string[] = [];
  if (session?.user?.id) {
    const likes = await db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(eq(commentLikes.userId, session.user.id));
    userLikes = likes.map((l) => l.commentId);
  }

  // Build nested structure
  interface FormattedComment {
    id: string;
    content: string;
    isTip: boolean;
    likeCount: number;
    parentId: string | null;
    createdAt: Date | null;
    isLiked: boolean;
    author: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
    };
    replies: FormattedComment[];
  }

  const commentMap = new Map<string, FormattedComment>();
  const topLevel: FormattedComment[] = [];

  for (const comment of comments) {
    const formatted: FormattedComment = {
      id: comment.id,
      content: comment.content,
      isTip: comment.isTip,
      likeCount: comment.likeCount,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      isLiked: userLikes.includes(comment.id),
      author: {
        id: comment.userId,
        name: comment.userName,
        image: comment.userImage,
        username: comment.userUsername,
      },
      replies: [] as FormattedComment[],
    };

    commentMap.set(comment.id, formatted);

    if (!comment.parentId) {
      topLevel.push(formatted);
    }
  }

  // Attach replies to parents
  for (const comment of comments) {
    if (comment.parentId && commentMap.has(comment.parentId)) {
      const parent = commentMap.get(comment.parentId);
      const child = commentMap.get(comment.id);
      if (parent && child) {
        parent.replies.push(child);
      }
    }
  }

  return NextResponse.json({
    comments: topLevel,
    total: comments.length,
  });
}

// POST /api/challenges/[id]/comments - Create a comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: challengeId } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Rate limiting - per user for comments
  const rateLimit = await checkRateLimit(
    env.RATE_LIMIT,
    session.user.id,
    RateLimitPresets.COMMENTS
  );
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(
      rateLimit,
      RateLimitPresets.COMMENTS,
      "Too many comments. Max 20 per hour."
    );
  }

  const body = await request.json() as { content?: string; parentId?: string; isTip?: boolean };
  const { content, parentId, isTip } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Content too long (max 2000 chars)" }, { status: 400 });
  }

  const id = crypto.randomUUID();

  await db.insert(challengeComments).values({
    id,
    challengeId,
    userId: session.user.id,
    parentId: parentId || null,
    content: content.trim(),
    isTip: isTip === true,
  });

  // Fetch the created comment with user info
  const [comment] = await db
    .select({
      id: challengeComments.id,
      content: challengeComments.content,
      isTip: challengeComments.isTip,
      likeCount: challengeComments.likeCount,
      parentId: challengeComments.parentId,
      createdAt: challengeComments.createdAt,
      userId: challengeComments.userId,
      userName: users.name,
      userImage: users.image,
      userUsername: users.username,
    })
    .from(challengeComments)
    .leftJoin(users, eq(challengeComments.userId, users.id))
    .where(eq(challengeComments.id, id))
    .limit(1);

  return NextResponse.json(
    {
      comment: {
        ...comment,
        author: {
          id: comment.userId,
          name: comment.userName,
          image: comment.userImage,
          username: comment.userUsername,
        },
        replies: [],
        isLiked: false,
      },
    },
    {
      headers: rateLimitHeaders(rateLimit, RateLimitPresets.COMMENTS),
    }
  );
}
