import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { achievements, userAchievements } from "@/db/schema";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

// Map achievement IDs to their challenge (auto-mapping by prefix)
function getChallengeForAchievement(id: string): string | null {
  if (id.startsWith("chess-")) return "chess";
  if (id.startsWith("snake-")) return "snake";
  if (id.startsWith("ttt-")) return "tic-tac-toe";
  if (id.startsWith("canvas-")) return "canvas-draw";
  if (id.startsWith("minesweeper-")) return "minesweeper";
  if (id.startsWith("sokoban-")) return "sokoban";
  return null;
}

// Milestone achievements (not challenge-specific)
const milestoneAchievements = [
  "first-login",
  "first-challenge",
  "level-5",
  "level-10",
  "streak-7",
  "all-games",
];

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

/**
 * GET /api/achievements
 * Returns all achievements with user unlock status
 *
 * Query params:
 * - challengeId: optional, filter by challenge
 */
export async function GET(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get("challengeId");

  // Get all achievements
  const allAchievements = await db.select().from(achievements);

  // Get user's unlocked achievements if authenticated
  let unlockedIds = new Set<string>();
  const session = await getSession();
  if (session?.user?.id) {
    const userUnlocked = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, session.user.id));
    unlockedIds = new Set(userUnlocked.map((a) => a.achievementId));
  }

  // Group achievements by challenge
  const byChallenge: Record<string, {
    total: number;
    unlocked: number;
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      points: number;
      rarity: string;
      unlocked: boolean;
    }>;
  }> = {};

  // Initialize challenge groups (must match getChallengeForAchievement)
  const challenges = ["chess", "tic-tac-toe", "snake", "canvas-draw", "minesweeper", "sokoban"];
  for (const c of challenges) {
    byChallenge[c] = { total: 0, unlocked: 0, achievements: [] };
  }
  byChallenge["milestone"] = { total: 0, unlocked: 0, achievements: [] };

  // Categorize achievements
  for (const achievement of allAchievements) {
    const challengeKey = getChallengeForAchievement(achievement.id) ||
      (milestoneAchievements.includes(achievement.id) ? "milestone" : null);

    if (!challengeKey) continue;

    const isUnlocked = unlockedIds.has(achievement.id);
    const group = byChallenge[challengeKey];
    if (group) {
      group.total++;
      if (isUnlocked) group.unlocked++;
      group.achievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        rarity: achievement.rarity,
        unlocked: isUnlocked,
      });
    }
  }

  // Filter by challenge if specified
  if (challengeId) {
    const filtered = byChallenge[challengeId];
    if (filtered) {
      return NextResponse.json({
        challengeId,
        ...filtered,
      });
    }
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  // Return summary for all challenges with achievement previews
  const summary: Record<string, {
    total: number;
    unlocked: number;
    achievements: Array<{
      id: string;
      icon: string;
      name: string;
      rarity: string;
      unlocked: boolean;
    }>;
  }> = {};
  for (const [key, value] of Object.entries(byChallenge)) {
    summary[key] = {
      total: value.total,
      unlocked: value.unlocked,
      // Include all achievements with minimal data for preview
      achievements: value.achievements.map(a => ({
        id: a.id,
        icon: a.icon,
        name: a.name,
        rarity: a.rarity,
        unlocked: a.unlocked,
      })),
    };
  }

  return NextResponse.json({
    summary,
    totalAchievements: allAchievements.length,
    totalUnlocked: unlockedIds.size,
    isAuthenticated: !!session?.user?.id,
  });
}
