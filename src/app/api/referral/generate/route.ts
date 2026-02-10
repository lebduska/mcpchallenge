import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { referralCodes, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

// Generate a short, readable referral code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 for readability
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/referral/generate - Get or create user's referral code
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

    // Check if user already has a referral code
    const [existing] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .limit(1);

    if (existing) {
      // Get user info for constructing share URL
      const [user] = await db
        .select({ username: users.username, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return NextResponse.json({
        code: existing.code,
        usageCount: existing.usageCount,
        maxUses: existing.maxUses,
        expiresAt: existing.expiresAt,
        shareUrl: `https://mcpchallenge.org/join?ref=${existing.code}`,
        displayName: user?.name || user?.username || "A friend",
      });
    }

    // Generate a new unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const [conflict] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, code))
        .limit(1);

      if (!conflict) break;
      code = generateCode();
      attempts++;
    }

    // Create the referral code
    const [newCode] = await db
      .insert(referralCodes)
      .values({
        code,
        userId,
        usageCount: 0,
        maxUses: null, // Unlimited by default
        expiresAt: null, // Never expires by default
      })
      .returning();

    // Get user info for constructing share URL
    const [user] = await db
      .select({ username: users.username, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      code: newCode.code,
      usageCount: 0,
      maxUses: null,
      expiresAt: null,
      shareUrl: `https://mcpchallenge.org/join?ref=${newCode.code}`,
      displayName: user?.name || user?.username || "A friend",
    });
  } catch (error) {
    console.error("Error generating referral code:", error);
    return NextResponse.json(
      { error: "Failed to generate referral code" },
      { status: 500 }
    );
  }
}
