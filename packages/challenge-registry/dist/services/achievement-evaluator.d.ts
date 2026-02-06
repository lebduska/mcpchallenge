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
import { type EarnedAchievement } from '../achievements';
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
    readonly progress?: number;
}
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
export declare class AchievementEvaluator {
    private readonly engines;
    private readonly definitions;
    /**
     * Register achievements for a challenge
     */
    register(challengeId: ChallengeId, achievements: readonly AchievementDefinition<unknown>[]): this;
    /**
     * Evaluate achievements for a completed game
     */
    evaluate<TMove>(input: EvaluationInput<TMove>): EvaluationOutput;
    /**
     * Get achievement definitions for a challenge
     */
    getDefinitions(challengeId: ChallengeId): readonly AchievementDefinition<unknown>[];
    /**
     * Check if challenge has achievements registered
     */
    hasAchievements(challengeId: ChallengeId): boolean;
    /**
     * Get achievement by ID
     */
    getAchievement(challengeId: ChallengeId, achievementId: AchievementId): AchievementDefinition<unknown> | undefined;
    /**
     * Get visible achievements (non-hidden)
     */
    getVisibleAchievements(challengeId: ChallengeId): readonly AchievementDefinition<unknown>[];
    /**
     * Compute stats only (without achievement evaluation)
     */
    computeStats<TMove>(replay: GameReplay<TMove>): GameStats;
}
export declare function createAchievementEvaluator(): AchievementEvaluator;
/**
 * Create evaluator pre-populated from challenge registry
 */
export declare function createAchievementEvaluatorFromRegistry(challenges: Iterable<{
    id: ChallengeId;
    achievements: readonly AchievementDefinition<unknown>[];
}>): AchievementEvaluator;
//# sourceMappingURL=achievement-evaluator.d.ts.map