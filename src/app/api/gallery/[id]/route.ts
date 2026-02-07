import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { galleryImages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

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

/**
 * GET /api/gallery/[id]
 * Serve an image from R2
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Lookup image metadata
  const [image] = await db
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.id, id));

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Check if private image
  if (!image.isPublic) {
    const session = await getSession();
    if (!session?.user?.id || session.user.id !== image.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Fetch from R2
  const object = await env.R2_GALLERY.get(image.r2Key);

  if (!object) {
    console.error(`R2 object not found: ${image.r2Key}`);
    return NextResponse.json(
      { error: "Image not found in storage" },
      { status: 404 }
    );
  }

  // Increment view count (non-blocking)
  db.update(galleryImages)
    .set({ viewCount: sql`${galleryImages.viewCount} + 1` })
    .where(eq(galleryImages.id, id))
    .execute()
    .catch((err) => console.error("Failed to increment view count:", err));

  // Return image with cache headers
  const headers = new Headers();
  headers.set("Content-Type", image.mimeType);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Content-Length", String(object.size));

  return new Response(object.body, { headers });
}

/**
 * DELETE /api/gallery/[id]
 * Delete an image (owner only)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Lookup image
  const [image] = await db
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.id, id));

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Check ownership
  if (image.userId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Delete from R2
  try {
    await env.R2_GALLERY.delete(image.r2Key);
  } catch (error) {
    console.error("R2 delete failed:", error);
    // Continue with DB deletion even if R2 fails
  }

  // Delete from D1
  await db.delete(galleryImages).where(eq(galleryImages.id, id));

  return NextResponse.json({ success: true });
}
