import { describe, it, expect } from "vitest";
import {
  evaluateAchievements,
  getDefaultUserStats,
  calculateLevel,
  type AchievementContext,
  type UserStatsData,
} from "../achievement-evaluator";

describe("evaluateAchievements", () => {
  const defaultStats: UserStatsData = getDefaultUserStats();

  it("grants first-challenge on first completion", () => {
    const ctx: AchievementContext = {
      challengeId: "any",
      result: { won: true },
      userStats: { ...defaultStats, challengesCompleted: 1 },
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("first-challenge");
  });

  it("does not re-grant existing achievements", () => {
    const ctx: AchievementContext = {
      challengeId: "any",
      result: { won: true },
      userStats: { ...defaultStats, challengesCompleted: 1 },
    };

    const earned = evaluateAchievements(ctx, new Set(["first-challenge"]));
    expect(earned).not.toContain("first-challenge");
  });

  it("grants chess-win on chess victory", () => {
    const ctx: AchievementContext = {
      challengeId: "chess",
      result: { winner: "player" },
      userStats: defaultStats,
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("chess-win");
  });

  it("does not grant chess-win on chess loss", () => {
    const ctx: AchievementContext = {
      challengeId: "chess",
      result: { winner: "ai" },
      userStats: defaultStats,
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).not.toContain("chess-win");
  });

  it("grants chess-master when 10+ chess wins", () => {
    const ctx: AchievementContext = {
      challengeId: "chess",
      result: { winner: "player" },
      userStats: { ...defaultStats, chessWins: 10 },
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("chess-master");
  });

  it("grants sokoban-first on first sokoban win", () => {
    const ctx: AchievementContext = {
      challengeId: "sokoban",
      levelId: "1",
      result: { won: true, moves: 50, pushes: 30 },
      userStats: defaultStats,
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("sokoban-first");
  });

  it("grants sokoban-perfect when moves === pushes", () => {
    const ctx: AchievementContext = {
      challengeId: "sokoban",
      levelId: "1",
      result: { won: true, moves: 30, pushes: 30 },
      userStats: defaultStats,
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("sokoban-perfect");
  });

  it("does not grant sokoban-perfect when moves !== pushes", () => {
    const ctx: AchievementContext = {
      challengeId: "sokoban",
      levelId: "1",
      result: { won: true, moves: 50, pushes: 30 },
      userStats: defaultStats,
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).not.toContain("sokoban-perfect");
  });

  it("grants sokoban-speedrun when under 30 seconds", () => {
    const ctx: AchievementContext = {
      challengeId: "sokoban",
      levelId: "1",
      result: { won: true, moves: 20, pushes: 15, timeMs: 25000 },
      userStats: defaultStats,
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("sokoban-speedrun");
  });

  it("does not grant sokoban-speedrun when over 30 seconds", () => {
    const ctx: AchievementContext = {
      challengeId: "sokoban",
      levelId: "1",
      result: { won: true, moves: 20, pushes: 15, timeMs: 35000 },
      userStats: defaultStats,
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).not.toContain("sokoban-speedrun");
  });

  it("grants sokoban-10 when 10+ levels completed", () => {
    const ctx: AchievementContext = {
      challengeId: "sokoban",
      levelId: "10",
      result: { won: true },
      userStats: { ...defaultStats, sokobanLevelsCompleted: 10 },
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("sokoban-10");
  });

  it("grants snake achievements based on score", () => {
    const ctx: AchievementContext = {
      challengeId: "snake",
      result: { score: 30 },
      userStats: defaultStats,
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("snake-10");
    expect(earned).toContain("snake-25");
    expect(earned).not.toContain("snake-50");
  });

  it("grants level-5 when user reaches level 5", () => {
    const ctx: AchievementContext = {
      challengeId: "any",
      result: { won: true },
      userStats: { ...defaultStats, level: 5 },
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("level-5");
  });

  it("can earn multiple achievements at once", () => {
    const ctx: AchievementContext = {
      challengeId: "chess",
      result: { winner: "player" },
      userStats: { ...defaultStats, challengesCompleted: 1, chessWins: 10 },
    };

    const earned = evaluateAchievements(ctx, new Set());
    expect(earned).toContain("first-challenge");
    expect(earned).toContain("chess-win");
    expect(earned).toContain("chess-master");
    expect(earned.length).toBeGreaterThanOrEqual(3);
  });
});

describe("calculateLevel", () => {
  it("returns level 1 for 0 points", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("returns level 2 for 100 points", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("returns level 3 for 250 points", () => {
    expect(calculateLevel(250)).toBe(3);
  });

  it("returns level 5 for 850 points", () => {
    expect(calculateLevel(850)).toBe(5);
  });

  it("handles points between thresholds", () => {
    expect(calculateLevel(150)).toBe(2); // between 100 and 250
    expect(calculateLevel(400)).toBe(3); // between 250 and 500
  });

  it("returns max level for very high points", () => {
    expect(calculateLevel(10000)).toBe(11);
  });
});

describe("getDefaultUserStats", () => {
  it("returns default stats with zeros", () => {
    const stats = getDefaultUserStats();
    expect(stats.totalPoints).toBe(0);
    expect(stats.level).toBe(1);
    expect(stats.challengesCompleted).toBe(0);
    expect(stats.sokobanLevelsCompleted).toBe(0);
  });
});
