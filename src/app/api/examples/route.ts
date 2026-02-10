import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { aiExamples } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = createDb(env.DB);

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");
    const strategy = searchParams.get("strategy");
    const aiProvider = searchParams.get("aiProvider");
    const difficulty = searchParams.get("difficulty");

    // Build conditions
    const conditions = [];
    if (challengeId) {
      conditions.push(eq(aiExamples.challengeId, challengeId));
    }
    if (strategy) {
      conditions.push(eq(aiExamples.strategy, strategy));
    }
    if (aiProvider) {
      conditions.push(eq(aiExamples.aiProvider, aiProvider));
    }
    if (difficulty) {
      conditions.push(eq(aiExamples.difficulty, difficulty));
    }

    const examples = await db
      .select()
      .from(aiExamples)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(aiExamples.sortOrder), asc(aiExamples.title));

    return NextResponse.json({ examples });
  } catch (error) {
    console.error("Error fetching AI examples:", error);
    return NextResponse.json(
      { error: "Failed to fetch examples" },
      { status: 500 }
    );
  }
}

// Increment view count
export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = createDb(env.DB);

    const { exampleId } = await request.json() as { exampleId?: string };
    if (!exampleId) {
      return NextResponse.json(
        { error: "Example ID required" },
        { status: 400 }
      );
    }

    await db
      .update(aiExamples)
      .set({ viewCount: sql`${aiExamples.viewCount} + 1` })
      .where(eq(aiExamples.id, exampleId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating view count:", error);
    return NextResponse.json(
      { error: "Failed to update view count" },
      { status: 500 }
    );
  }
}
