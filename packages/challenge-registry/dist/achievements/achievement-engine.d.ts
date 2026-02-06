/**
 * Achievement Engine
 *
 * Rule-based achievement evaluation over Replay data.
 * Declarative, composable, type-safe.
 */
import type { GameResult } from '../types/engine';
import type { GameReplay } from '../types/replay';
import type { AchievementId, AchievementDefinition, AchievementRarity, AchievementContext, GameStats } from '../types/challenge';
/**
 * Base rule that can be evaluated against replay context
 */
export interface AchievementRule<TMove = unknown> {
    readonly type: string;
    readonly evaluate: (context: AchievementContext<TMove>) => boolean;
    readonly describe: () => string;
}
/**
 * Rule composition operators
 */
export type CompositeRule<TMove = unknown> = AndRule<TMove> | OrRule<TMove> | NotRule<TMove>;
interface AndRule<TMove> {
    readonly type: 'and';
    readonly rules: readonly AchievementRule<TMove>[];
    readonly evaluate: (context: AchievementContext<TMove>) => boolean;
    readonly describe: () => string;
}
interface OrRule<TMove> {
    readonly type: 'or';
    readonly rules: readonly AchievementRule<TMove>[];
    readonly evaluate: (context: AchievementContext<TMove>) => boolean;
    readonly describe: () => string;
}
interface NotRule<TMove> {
    readonly type: 'not';
    readonly rule: AchievementRule<TMove>;
    readonly evaluate: (context: AchievementContext<TMove>) => boolean;
    readonly describe: () => string;
}
/**
 * Game outcome rules
 */
export declare const outcome: {
    /** Player won the game */
    won(): AchievementRule;
    /** Player lost the game */
    lost(): AchievementRule;
    /** Game ended in draw */
    draw(): AchievementRule;
    /** Game completed (any outcome) */
    completed(): AchievementRule;
    /** Won with specific score */
    wonWithScore(minScore: number): AchievementRule;
};
/**
 * Move count rules
 */
export declare const moves: {
    /** Total moves (player + AI) */
    total(comparison: Comparison, value: number): AchievementRule;
    /** Player moves only */
    player(comparison: Comparison, value: number): AchievementRule;
    /** Won in exactly N moves */
    wonInMoves(maxMoves: number): AchievementRule;
    /** Perfect game (minimum possible moves) */
    perfect(optimalMoves: number): AchievementRule;
};
/**
 * Time-based rules
 */
export declare const time: {
    /** Total game duration */
    duration(comparison: Comparison, ms: number): AchievementRule;
    /** Won within time limit */
    wonWithin(ms: number): AchievementRule;
    /** Average move time */
    averageMoveTime(comparison: Comparison, ms: number): AchievementRule;
    /** Fastest move */
    fastestMove(comparison: Comparison, ms: number): AchievementRule;
    /** No move took longer than */
    noMoveLongerThan(ms: number): AchievementRule;
};
/**
 * Error/undo rules (for "clean" play achievements)
 */
export declare const mistakes: {
    /** No undos used */
    noUndos(): AchievementRule;
    /** No errors occurred */
    noErrors(): AchievementRule;
    /** Flawless (no undos, no errors, won) */
    flawless(): AchievementRule;
};
/**
 * Replay event pattern rules
 */
export declare const patterns: {
    /** Check if a specific move pattern exists */
    hasMove<TMove>(predicate: (move: TMove, index: number) => boolean): AchievementRule<TMove>;
    /** All player moves match predicate */
    allMoves<TMove>(predicate: (move: TMove) => boolean): AchievementRule<TMove>;
    /** Consecutive moves matching predicate */
    consecutiveMoves<TMove>(count: number, predicate: (move: TMove) => boolean): AchievementRule<TMove>;
    /** First move matches */
    firstMove<TMove>(predicate: (move: TMove) => boolean): AchievementRule<TMove>;
    /** Last move matches */
    lastMove<TMove>(predicate: (move: TMove) => boolean): AchievementRule<TMove>;
};
/**
 * Custom rule builder
 */
export declare function custom<TMove = unknown>(name: string, evaluate: (context: AchievementContext<TMove>) => boolean, description?: string): AchievementRule<TMove>;
/**
 * All rules must pass (AND)
 */
export declare function all<TMove>(...rules: AchievementRule<TMove>[]): AchievementRule<TMove>;
/**
 * Any rule must pass (OR)
 */
export declare function any<TMove>(...rules: AchievementRule<TMove>[]): AchievementRule<TMove>;
/**
 * Negate a rule (NOT)
 */
export declare function not<TMove>(rule: AchievementRule<TMove>): AchievementRule<TMove>;
/**
 * Fluent builder for creating achievements
 */
export declare class AchievementBuilder<TMove = unknown> {
    private _id;
    private _name;
    private _description;
    private _rarity;
    private _points;
    private _iconUrl?;
    private _hidden;
    private _rules;
    id(id: string): this;
    name(name: string): this;
    description(desc: string): this;
    rarity(rarity: AchievementRarity): this;
    points(points: number): this;
    icon(url: string): this;
    hidden(hidden?: boolean): this;
    /**
     * Add a rule (multiple calls = AND)
     */
    when(rule: AchievementRule<TMove>): this;
    /**
     * Add multiple rules (AND)
     */
    whenAll(...rules: AchievementRule<TMove>[]): this;
    /**
     * Add alternative rules (OR)
     */
    whenAny(...rules: AchievementRule<TMove>[]): this;
    /**
     * Build the achievement definition
     */
    build(): AchievementDefinition<TMove>;
}
/**
 * Start building an achievement
 */
export declare function achievement<TMove = unknown>(): AchievementBuilder<TMove>;
/**
 * Evaluate achievements against replay data
 */
export declare class AchievementEngine<TMove = unknown> {
    private readonly achievements;
    /**
     * Register achievements
     */
    register(...achievements: AchievementDefinition<TMove>[]): this;
    /**
     * Evaluate all achievements for a completed game
     */
    evaluate(result: GameResult, replay: GameReplay<TMove>): AchievementEvaluation;
    /**
     * Check a single achievement
     */
    check(achievementId: AchievementId, result: GameResult, replay: GameReplay<TMove>): boolean;
    /**
     * Get all registered achievements
     */
    getAll(): readonly AchievementDefinition<TMove>[];
    /**
     * Get achievement by ID
     */
    get(id: AchievementId): AchievementDefinition<TMove> | undefined;
}
export interface AchievementEvaluation {
    readonly earned: readonly EarnedAchievement[];
    readonly failed: readonly FailedAchievement[];
    readonly totalPoints: number;
    readonly stats: GameStats;
}
export interface EarnedAchievement {
    readonly id: AchievementId;
    readonly name: string;
    readonly description: string;
    readonly rarity: AchievementRarity;
    readonly points: number;
}
export interface FailedAchievement {
    readonly id: AchievementId;
    readonly name: string;
    readonly description: string;
    readonly error?: string;
}
/**
 * Compute game statistics from replay
 */
export declare function computeGameStats<TMove>(replay: GameReplay<TMove>): GameStats;
type Comparison = 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'neq';
/**
 * Create a new achievement engine
 */
export declare function createAchievementEngine<TMove = unknown>(): AchievementEngine<TMove>;
export {};
//# sourceMappingURL=achievement-engine.d.ts.map