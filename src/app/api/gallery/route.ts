import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { galleryImages, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const runtime = "edge";

/**
 * GET /api/gallery
 * List gallery images with filtering and pagination
 *
 * Query params:
 * - challengeId: filter by challenge (canvas-draw, fractals)
 * - userId: filter by user
 * - sort: "new" | "popular" | "views" (default: new)
 * - limit: number of results (default: 20, max: 100)
 * - offset: pagination offset
 */
export async function GET(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get("challengeId");
  const userId = searchParams.get("userId");
  const sort = searchParams.get("sort") || "new";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build query conditions
  const conditions = [eq(galleryImages.isPublic, true)];

  if (challengeId) {
    conditions.push(eq(galleryImages.challengeId, challengeId));
  }
  if (userId) {
    conditions.push(eq(galleryImages.userId, userId));
  }

  // Build query with author join
  const query = db
    .select({
      id: galleryImages.id,
      challengeId: galleryImages.challengeId,
      title: galleryImages.title,
      width: galleryImages.width,
      height: galleryImages.height,
      viewCount: galleryImages.viewCount,
      likeCount: galleryImages.likeCount,
      createdAt: galleryImages.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
      authorUsername: users.username,
    })
    .from(galleryImages)
    .leftJoin(users, eq(galleryImages.userId, users.id))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);

  // Apply sorting
  let images;
  switch (sort) {
    case "popular":
      images = await query.orderBy(desc(galleryImages.likeCount), desc(galleryImages.createdAt));
      break;
    case "views":
      images = await query.orderBy(desc(galleryImages.viewCount), desc(galleryImages.createdAt));
      break;
    case "new":
    default:
      images = await query.orderBy(desc(galleryImages.createdAt));
      break;
  }

  // Format response
  const formattedImages = images.map((img) => ({
    id: img.id,
    url: `/api/gallery/${img.id}`,
    challengeId: img.challengeId,
    title: img.title,
    width: img.width,
    height: img.height,
    viewCount: img.viewCount,
    likeCount: img.likeCount,
    createdAt: img.createdAt,
    author: {
      id: img.authorId,
      name: img.authorName,
      image: img.authorImage,
      username: img.authorUsername,
    },
  }));

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(galleryImages)
    .where(and(...conditions));
  const total = countResult[0]?.count || 0;

  return NextResponse.json({
    images: formattedImages,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + images.length < total,
    },
  });
}
