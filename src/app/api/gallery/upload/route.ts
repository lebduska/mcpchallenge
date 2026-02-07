import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { galleryImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

// Rate limit config
const RATE_LIMIT_MAX = 10; // max uploads
const RATE_LIMIT_WINDOW = 3600; // per hour (seconds)

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: Request): string {
  // Cloudflare provides the real IP
  const cfIP = request.headers.get("CF-Connecting-IP");
  if (cfIP) return cfIP;

  // Fallback to X-Forwarded-For
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();

  // Last resort
  return "unknown";
}

/**
 * Check and update rate limit using KV
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
async function checkRateLimit(
  kv: KVNamespace,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % RATE_LIMIT_WINDOW);
  const key = `upload:${identifier}:${windowStart}`;

  const currentStr = await kv.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  if (current >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowStart + RATE_LIMIT_WINDOW,
    };
  }

  // Increment counter with TTL
  await kv.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW,
  });

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - current - 1,
    resetAt: windowStart + RATE_LIMIT_WINDOW,
  };
}

/**
 * Compute SHA256 hash of ArrayBuffer
 */
async function sha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * POST /api/gallery/upload
 * Upload an image to the gallery
 */
export async function POST(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Rate limiting - check before expensive operations
  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit(env.RATE_LIMIT, clientIP);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Maximum 10 uploads per hour.",
        retryAfter: rateLimit.resetAt - Math.floor(Date.now() / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            rateLimit.resetAt - Math.floor(Date.now() / 1000)
          ),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    );
  }

  const session = await getSession();

  // Parse request body
  const body = (await request.json()) as {
    challengeId?: string;
    imageData?: string;
    title?: string;
    isPublic?: boolean;
  };

  const { challengeId, imageData, title, isPublic = true } = body;

  // Validate required fields
  if (!challengeId || !imageData) {
    return NextResponse.json(
      { error: "challengeId and imageData are required" },
      { status: 400 }
    );
  }

  // Validate challenge ID
  const validChallenges = ["canvas-draw", "fractals"];
  if (!validChallenges.includes(challengeId)) {
    return NextResponse.json(
      { error: "Invalid challengeId" },
      { status: 400 }
    );
  }

  // Validate base64 format
  const base64Match = imageData.match(/^data:image\/png;base64,(.+)$/);
  if (!base64Match) {
    return NextResponse.json(
      { error: "Invalid image format. Must be base64 PNG" },
      { status: 400 }
    );
  }

  const base64Data = base64Match[1];

  // Decode base64 to ArrayBuffer
  let imageBuffer: ArrayBuffer;
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    imageBuffer = bytes.buffer;
  } catch {
    return NextResponse.json(
      { error: "Failed to decode base64 image" },
      { status: 400 }
    );
  }

  // Check file size (max 500KB)
  const maxSize = 500 * 1024;
  if (imageBuffer.byteLength > maxSize) {
    return NextResponse.json(
      { error: `Image too large. Maximum size is 500KB` },
      { status: 400 }
    );
  }

  // Compute SHA256 hash for content-addressed storage
  const hash = await sha256(imageBuffer);
  const r2Key = `images/${hash}.png`;

  // Check if image already exists (deduplication)
  const [existing] = await db
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.r2Key, r2Key));

  if (existing) {
    // Return existing image
    return NextResponse.json({
      id: existing.id,
      url: `/api/gallery/${existing.id}`,
      shareUrl: `https://mcpchallenge.org/gallery/${existing.id}`,
      isNew: false,
    });
  }

  // Upload to R2
  try {
    await env.R2_GALLERY.put(r2Key, imageBuffer, {
      httpMetadata: {
        contentType: "image/png",
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("R2 upload failed:", error);
    return NextResponse.json(
      { error: "Failed to upload image to storage" },
      { status: 500 }
    );
  }

  // Insert metadata to D1
  const imageId = crypto.randomUUID();

  await db.insert(galleryImages).values({
    id: imageId,
    userId: session?.user?.id || null,
    challengeId,
    r2Key,
    title: title?.trim() || null,
    width: 512, // Default canvas size
    height: 512,
    fileSize: imageBuffer.byteLength,
    mimeType: "image/png",
    isPublic,
  });

  return NextResponse.json(
    {
      id: imageId,
      url: `/api/gallery/${imageId}`,
      shareUrl: `https://mcpchallenge.org/gallery/${imageId}`,
      isNew: true,
    },
    {
      status: 201,
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      },
    }
  );
}
