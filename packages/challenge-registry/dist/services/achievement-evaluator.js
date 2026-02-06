/**
 * Achievement Evaluator
 *
 * Evaluates achievements for completed games.
 * Thin wrapper around AchievementEngine for service consistency.
 */
import { AchievementEngine, computeGameStats, } from '../achievements';
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
    engines = new Map();
    definitions = new Map();
    /**
     * Register achievements for a challenge
     */
    register(challengeId, achievements) {
        const engine = new AchievementEngine();
        engine.register(...achievements);
        this.engines.set(challengeId, engine);
        this.definitions.set(challengeId, achievements);
        return this;
    }
    /**
     * Evaluate achievements for a completed game
     */
    evaluate(input) {
        const engine = this.engines.get(input.challengeId);
        const defs = this.definitions.get(input.challengeId) ?? [];
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
        const evaluation = engine.evaluate(input.result, input.replay);
        // Build summary
        const rarityBreakdown = {};
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
    getDefinitions(challengeId) {
        return this.definitions.get(challengeId) ?? [];
    }
    /**
     * Check if challenge has achievements registered
     */
    hasAchievements(challengeId) {
        return this.engines.has(challengeId);
    }
    /**
     * Get achievement by ID
     */
    getAchievement(challengeId, achievementId) {
        const defs = this.definitions.get(challengeId);
        return defs?.find((d) => d.id === achievementId);
    }
    /**
     * Get visible achievements (non-hidden)
     */
    getVisibleAchievements(challengeId) {
        const defs = this.definitions.get(challengeId) ?? [];
        return defs.filter((d) => !d.hidden);
    }
    /**
     * Compute stats only (without achievement evaluation)
     */
    computeStats(replay) {
        return computeGameStats(replay);
    }
}
// =============================================================================
// Factory
// =============================================================================
export function createAchievementEvaluator() {
    return new AchievementEvaluator();
}
/**
 * Create evaluator pre-populated from challenge registry
 */
export function createAchievementEvaluatorFromRegistry(challenges) {
    const evaluator = new AchievementEvaluator();
    for (const challenge of challenges) {
        evaluator.register(challenge.id, challenge.achievements);
    }
    return evaluator;
}
//# sourceMappingURL=achievement-evaluator.js.map