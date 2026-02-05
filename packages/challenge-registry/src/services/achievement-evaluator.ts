/**
 * Achievement Evaluator
 *
 * Evaluates achievements for completed games.
 * Thin wrapper around AchievementEngine for service consistency.
 */

import type { GameResult } from '../types/engine';
import type { ChallengeId, AchievementDefinition, AchievementId } from '../types/challenge';
import type { GameReplay } from '../types/replay';
import type { GameStats } from '../types/challenge';
import {
  AchievementEngine,
  computeGameStats,
  type AchievementEvaluation,
  type EarnedAchievement,
} from '../achievements';

// =============================================================================
// Types
// =============================================================================

/**
 * Evaluation input
 */
export interface EvaluationInput<TMove = unknown> {
  readonly challengeId: ChallengeId;
  readonly result: GameResult;
  readonly replay: GameReplay<TMove>;
}

/**
 * Evaluation output
 */
export interface EvaluationOutput {
  readonly earned: readonly EarnedAchievement[];
  readonly earnedIds: readonly AchievementId[];
  readonly totalPoints: number;
  readonly stats: GameStats;
  readonly summary: EvaluationSummary;
}

export interface EvaluationSummary {
  readonly totalAchievements: number;
  readonly earnedCount: number;
  readonly earnedPercentage: number;
  readonly rarityBreakdown: Record<string, number>;
}

/**
 * Achievement progress (for partial tracking)
 */
export interface AchievementProgress {
  readonly id: AchievementId;
  readonly name: string;
  readonly description: string;
  readonly earned: boolean;
  readonly progress?: number; // 0-100 if trackable
}

// =============================================================================
// Achievement Evaluator
// =============================================================================

/**
 * Achievement Evaluator Service
 *
 * Responsibilities:
 * - Evaluate achievements for completed games
 * - Track achievement definitions per challenge
 * - Compute game statistics
 *
 * NOT responsible for:
 * - Storing earned achievements (persistence layer)
 * - User progress tracking (separate service)
 */
export class AchievementEvaluator {
  private readonly engines: Map<string, AchievementEngine<unknown>> = new Map();
  private readonly definitions: Map<string, readonly AchievementDefinition<unknown>[]> = new Map();

  /**
   * Register achievements for a challenge
   */
  register(
    challengeId: ChallengeId,
    achievements: readonly AchievementDefinition<unknown>[]
  ): this {
    const engine = new AchievementEngine<unknown>();
    engine.register(...achievements);

    this.engines.set(challengeId as string, engine);
    this.definitions.set(challengeId as string, achievements);

    return this;
  }

  /**
   * Evaluate achievements for a completed game
   */
  evaluate<TMove>(input: EvaluationInput<TMove>): EvaluationOutput {
    const engine = this.engines.get(input.challengeId as string);
    const defs = this.definitions.get(input.challengeId as string) ?? [];

    if (!engine) {
      // No achievements registered for this challenge
      return {
        earned: [],
        earnedIds: [],
        totalPoints: 0,
        stats: computeGameStats(input.replay),
        summary: {
          totalAchievements: 0,
          earnedCount: 0,
          earnedPercentage: 0,
          rarityBreakdown: {},
        },
      };
    }

    const evaluation = engine.evaluate(input.result, input.replay as GameReplay<unknown>);

    // Build summary
    const rarityBreakdown: Record<string, number> = {};
    for (const earned of evaluation.earned) {
      rarityBreakdown[earned.rarity] = (rarityBreakdown[earned.rarity] ?? 0) + 1;
    }

    return {
      earned: evaluation.earned,
      earnedIds: evaluation.earned.map((e) => e.id),
      totalPoints: evaluation.totalPoints,
      stats: evaluation.stats,
      summary: {
        totalAchievements: defs.length,
        earnedCount: evaluation.earned.length,
        earnedPercentage: defs.length > 0
          ? Math.round((evaluation.earned.length / defs.length) * 100)
          : 0,
        rarityBreakdown,
      },
    };
  }

  /**
   * Get achievement definitions for a challenge
   */
  getDefinitions(challengeId: ChallengeId): readonly AchievementDefinition<unknown>[] {
    return this.definitions.get(challengeId as string) ?? [];
  }

  /**
   * Check if challenge has achievements registered
   */
  hasAchievements(challengeId: ChallengeId): boolean {
    return this.engines.has(challengeId as string);
  }

  /**
   * Get achievement by ID
   */
  getAchievement(
    challengeId: ChallengeId,
    achievementId: AchievementId
  ): AchievementDefinition<unknown> | undefined {
    const defs = this.definitions.get(challengeId as string);
    return defs?.find((d) => d.id === achievementId);
  }

  /**
   * Get visible achievements (non-hidden)
   */
  getVisibleAchievements(
    challengeId: ChallengeId
  ): readonly AchievementDefinition<unknown>[] {
    const defs = this.definitions.get(challengeId as string) ?? [];
    return defs.filter((d) => !d.hidden);
  }

  /**
   * Compute stats only (without achievement evaluation)
   */
  computeStats<TMove>(replay: GameReplay<TMove>): GameStats {
    return computeGameStats(replay);
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createAchievementEvaluator(): AchievementEvaluator {
  return new AchievementEvaluator();
}

/**
 * Create evaluator pre-populated from challenge registry
 */
export function createAchievementEvaluatorFromRegistry(
  challenges: Iterable<{ id: ChallengeId; achievements: readonly AchievementDefinition<unknown>[] }>
): AchievementEvaluator {
  const evaluator = new AchievementEvaluator();

  for (const challenge of challenges) {
    evaluator.register(challenge.id, challenge.achievements);
  }

  return evaluator;
}
