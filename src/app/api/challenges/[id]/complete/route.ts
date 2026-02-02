import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import {
  challengeCompletions,
  userStats,
  userAchievements,
  achievements,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

interface AchievementRule {
  id: string;
  check: (data: CompletionData, stats: UserStatsData) => boolean;
}

interface CompletionData {
  challengeId: string;
  score?: number;
  winner?: string;
  moves?: number;
  type?: "game" | "tutorial";
}

interface UserStatsData {
  totalPoints: number;
  level: number;
  challengesCompleted: number;
  chessWins: number;
  snakeHighScore: number;
  ticTacToeWins: number;
  completedMcpChallenges: Set<string>;
}

// MCP Build Challenge IDs
const MCP_CHALLENGES = [
  "hello-world",
  "calculator",
  "file-reader",
  "weather-api",
  "canvas-draw",
  "multi-tool",
  "data-pipeline",
];

const MCP_BASIC_CHALLENGES = ["hello-world", "calculator", "file-reader"];

// Achievement rules
const achievementRules: AchievementRule[] = [
  // First challenge
  {
    id: "first-challenge",
    check: (_, stats) => stats.challengesCompleted === 1,
  },
  // MCP Build Challenge achievements
  {
    id: "mcp-hello-world",
    check: (data) => data.challengeId === "hello-world" && data.type === "tutorial",
  },
  {
    id: "mcp-calculator",
    check: (data) => data.challengeId === "calculator" && data.type === "tutorial",
  },
  {
    id: "mcp-file-reader",
    check: (data) => data.challengeId === "file-reader" && data.type === "tutorial",
  },
  {
    id: "mcp-weather-api",
    check: (data) => data.challengeId === "weather-api" && data.type === "tutorial",
  },
  {
    id: "mcp-multi-tool",
    check: (data) => data.challengeId === "multi-tool" && data.type === "tutorial",
  },
  {
    id: "mcp-data-pipeline",
    check: (data) => data.challengeId === "data-pipeline" && data.type === "tutorial",
  },
  {
    id: "mcp-canvas-draw",
    check: (data) => data.challengeId === "canvas-draw" && data.type === "tutorial",
  },
  {
    id: "mcp-all-basics",
    check: (data, stats) => {
      if (data.type !== "tutorial") return false;
      const completed = new Set([...stats.completedMcpChallenges, data.challengeId]);
      return MCP_BASIC_CHALLENGES.every((c) => completed.has(c));
    },
  },
  {
    id: "mcp-all-challenges",
    check: (data, stats) => {
      if (data.type !== "tutorial") return false;
      const completed = new Set([...stats.completedMcpChallenges, data.challengeId]);
      return MCP_CHALLENGES.every((c) => completed.has(c));
    },
  },
  // Chess achievements
  {
    id: "chess-win",
    check: (data) => data.challengeId === "chess" && data.winner === "player",
  },
  {
    id: "chess-master",
    check: (_, stats) => stats.chessWins >= 10,
  },
  // Snake achievements
  {
    id: "snake-10",
    check: (data) =>
      data.challengeId === "snake" && (data.score || 0) >= 10,
  },
  {
    id: "snake-25",
    check: (data) =>
      data.challengeId === "snake" && (data.score || 0) >= 25,
  },
  {
    id: "snake-50",
    check: (data) =>
      data.challengeId === "snake" && (data.score || 0) >= 50,
  },
  // Tic-tac-toe achievements
  {
    id: "ttt-win",
    check: (data) =>
      data.challengeId === "tic-tac-toe" && data.winner === "player",
  },
  {
    id: "ttt-master",
    check: (_, stats) => stats.ticTacToeWins >= 5,
  },
  // Level achievements
  {
    id: "level-5",
    check: (_, stats) => stats.level >= 5,
  },
  {
    id: "level-10",
    check: (_, stats) => stats.level >= 10,
  },
];

// Calculate level from points (Fibonacci-like progression)
function calculateLevel(points: number): number {
  const thresholds = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4600, 5900];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) return i + 1;
  }
  return 1;
}

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: PageProps) {
  const { id: challengeId } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = (await request.json()) as {
    score?: number;
    winner?: string;
    moves?: number;
    type?: "game" | "tutorial";
  };

  // Record the completion
  await db.insert(challengeCompletions).values({
    id: crypto.randomUUID(),
    userId,
    challengeId,
    score: body.score || null,
    completedAt: new Date(),
  });

  // Get or create user stats
  let stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, userId),
  });

  if (!stats) {
    const newStats = {
      userId,
      totalPoints: 0,
      level: 1,
      challengesCompleted: 0,
      achievementsUnlocked: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
    await db.insert(userStats).values(newStats);
    stats = {
      ...newStats,
      lastActiveAt: null,
      updatedAt: new Date(),
    };
  }

  // Calculate extended stats for achievement checking
  const chessWins = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "chess")
      )
    );

  const snakeScores = await db
    .select({ maxScore: sql<number>`max(score)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "snake")
      )
    );

  const tttWins = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "tic-tac-toe")
      )
    );

  // Get completed MCP challenges
  const mcpCompletions = await db
    .select({ challengeId: challengeCompletions.challengeId })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        sql`${challengeCompletions.challengeId} IN ('hello-world', 'calculator', 'file-reader', 'weather-api', 'canvas-draw', 'multi-tool', 'data-pipeline')`
      )
    );

  const extendedStats: UserStatsData = {
    totalPoints: stats.totalPoints,
    level: stats.level,
    challengesCompleted: stats.challengesCompleted + 1,
    chessWins: Number(chessWins[0]?.count || 0),
    snakeHighScore: Number(snakeScores[0]?.maxScore || 0),
    ticTacToeWins: Number(tttWins[0]?.count || 0),
    completedMcpChallenges: new Set(mcpCompletions.map((c) => c.challengeId)),
  };

  const completionData: CompletionData = {
    challengeId,
    score: body.score,
    winner: body.winner,
    moves: body.moves,
    type: body.type,
  };

  // Get user's existing achievements
  const existingAchievements = await db
    .select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const existingIds = new Set(existingAchievements.map((a) => a.achievementId));

  // Check for new achievements
  const newAchievements: string[] = [];
  let pointsEarned = 0;

  for (const rule of achievementRules) {
    if (!existingIds.has(rule.id) && rule.check(completionData, extendedStats)) {
      // Get achievement details
      const achievement = await db.query.achievements.findFirst({
        where: eq(achievements.id, rule.id),
      });

      if (achievement) {
        // Grant the achievement
        await db.insert(userAchievements).values({
          userId,
          achievementId: rule.id,
          unlockedAt: new Date(),
        });

        newAchievements.push(rule.id);
        pointsEarned += achievement.points;
      }
    }
  }

  // Update user stats
  const newTotalPoints = stats.totalPoints + pointsEarned;
  const newLevel = calculateLevel(newTotalPoints);

  await db
    .update(userStats)
    .set({
      totalPoints: newTotalPoints,
      level: newLevel,
      challengesCompleted: stats.challengesCompleted + 1,
    })
    .where(eq(userStats.userId, userId));

  // Check for level-up achievements after updating stats
  if (newLevel >= 5 && !existingIds.has("level-5")) {
    const levelAchievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, "level-5"),
    });
    if (levelAchievement) {
      await db.insert(userAchievements).values({
        userId,
        achievementId: "level-5",
        unlockedAt: new Date(),
      });
      newAchievements.push("level-5");
    }
  }

  if (newLevel >= 10 && !existingIds.has("level-10")) {
    const levelAchievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, "level-10"),
    });
    if (levelAchievement) {
      await db.insert(userAchievements).values({
        userId,
        achievementId: "level-10",
        unlockedAt: new Date(),
      });
      newAchievements.push("level-10");
    }
  }

  // Get full achievement details for response
  const unlockedAchievements = await Promise.all(
    newAchievements.map(async (id) => {
      const achievement = await db.query.achievements.findFirst({
        where: eq(achievements.id, id),
      });
      return achievement;
    })
  );

  return NextResponse.json({
    success: true,
    pointsEarned,
    newAchievements: unlockedAchievements.filter(Boolean),
    stats: {
      totalPoints: newTotalPoints,
      level: newLevel,
      challengesCompleted: stats.challengesCompleted + 1,
    },
  });
}
