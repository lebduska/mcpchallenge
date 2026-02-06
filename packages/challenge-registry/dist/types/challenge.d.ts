/**
 * Challenge Definition Types
 *
 * Defines the structure for game challenges with full type inference
 * from the underlying GameEngine.
 */
import type { GameEngine, GameState, GameResult, Difficulty, StateOf, MoveOf, OptionsOf, BoardOf } from './engine';
import type { GameReplay, ReplayValidationResult } from './replay';
declare const __brand: unique symbol;
type Brand<T, B> = T & {
    readonly [__brand]: B;
};
/** Unique challenge identifier */
export type ChallengeId = Brand<string, 'ChallengeId'>;
/** Achievement identifier */
export type AchievementId = Brand<string, 'AchievementId'>;
/**
 * Challenge difficulty level with progression
 */
export type ChallengeDifficulty = 1 | 2 | 3 | 4 | 5;
/**
 * Learning concepts covered by the challenge
 */
export type LearningConcept = 'tool_basics' | 'state_management' | 'error_handling' | 'strategy' | 'optimization' | 'multi_step' | 'real_time' | 'resource_management';
/**
 * Challenge metadata (display information)
 */
export interface ChallengeMeta {
    readonly name: string;
    readonly description: string;
    readonly difficulty: ChallengeDifficulty;
    readonly concepts: readonly LearningConcept[];
    readonly estimatedMinutes?: number;
    readonly iconUrl?: string;
    readonly tags?: readonly string[];
}
/**
 * Achievement rarity levels
 */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
/**
 * Achievement definition
 */
export interface AchievementDefinition<TMove = unknown> {
    readonly id: AchievementId;
    readonly name: string;
    readonly description: string;
    readonly rarity: AchievementRarity;
    readonly points: number;
    readonly iconUrl?: string;
    readonly hidden?: boolean;
    /**
     * Check if achievement is earned from game result
     * Pure function - no side effects
     */
    readonly check: AchievementChecker<TMove>;
}
/**
 * Achievement checker function signature
 */
export type AchievementChecker<TMove = unknown> = (context: AchievementContext<TMove>) => boolean;
/**
 * Context passed to achievement checkers
 */
export interface AchievementContext<TMove = unknown> {
    readonly result: GameResult;
    readonly replay: GameReplay<TMove>;
    readonly stats: GameStats;
}
/**
 * Computed game statistics for achievement evaluation
 */
export interface GameStats {
    readonly totalMoves: number;
    readonly playerMoves: number;
    readonly aiMoves: number;
    readonly duration: number;
    readonly averageMoveTime: number;
    readonly fastestMove: number;
    readonly slowestMove: number;
    readonly undoCount: number;
    readonly errorCount: number;
}
/**
 * Scoring configuration
 */
export interface ScoringConfig {
    /** Base points for completing the challenge */
    readonly basePoints: number;
    /** Bonus points for winning (vs draw) */
    readonly winBonus?: number;
    /** Bonus multiplier for each difficulty level */
    readonly difficultyMultiplier?: number;
    /** Time bonus (points per second under par) */
    readonly timeBonus?: {
        readonly parSeconds: number;
        readonly pointsPerSecond: number;
        readonly maxBonus: number;
    };
    /** Move efficiency bonus */
    readonly efficiencyBonus?: {
        readonly parMoves: number;
        readonly pointsPerMove: number;
        readonly maxBonus: number;
    };
}
/**
 * Score calculation result
 */
export interface ScoreResult {
    readonly baseScore: number;
    readonly bonuses: readonly ScoreBonus[];
    readonly totalScore: number;
    readonly breakdown: string;
}
export interface ScoreBonus {
    readonly type: string;
    readonly points: number;
    readonly reason: string;
}
/**
 * Board renderer for UI display
 */
export interface BoardRenderer<TBoard, TRenderOutput = unknown> {
    readonly type: 'ascii' | 'json' | 'svg' | 'canvas' | 'custom';
    /**
     * Render board to output format
     */
    readonly render: (board: TBoard) => TRenderOutput;
    /**
     * Optional animation support
     */
    readonly animate?: (from: TBoard, to: TBoard) => TRenderOutput;
}
/**
 * Complete challenge definition with full type inference
 *
 * @typeParam TEngine - The game engine type
 */
export interface ChallengeDefinition<TEngine extends GameEngine<GameState, unknown, Record<string, unknown>, unknown>> {
    /** Unique challenge identifier */
    readonly id: ChallengeId;
    /** Challenge metadata */
    readonly meta: ChallengeMeta;
    /** The game engine instance */
    readonly engine: TEngine;
    /** Default game options */
    readonly defaultOptions?: OptionsOf<TEngine>;
    /** Available difficulty levels (maps to engine difficulty) */
    readonly difficulties: readonly Difficulty[];
    /** Achievement definitions */
    readonly achievements: readonly AchievementDefinition<MoveOf<TEngine>>[];
    /** Scoring configuration */
    readonly scoring: ScoringConfig;
    /** Board renderer (optional) */
    readonly renderer?: BoardRenderer<BoardOf<TEngine>>;
    /**
     * Custom replay validator (optional)
     * Used in addition to standard validation
     */
    readonly validateReplay?: (replay: GameReplay<MoveOf<TEngine>>) => ReplayValidationResult;
    /**
     * Custom completion checker (optional)
     * Determines if challenge objectives are met beyond just winning
     */
    readonly isComplete?: (result: GameResult, replay: GameReplay<MoveOf<TEngine>>) => boolean;
}
/**
 * Map of all challenges (indexed by ID)
 * @deprecated Use ChallengeRegistry class from registry module instead
 */
export type ChallengeMap = Readonly<Record<string, ChallengeDefinition<GameEngine<GameState, unknown, Record<string, unknown>, unknown>>>>;
/**
 * Challenge completion record
 */
export interface ChallengeCompletion {
    readonly challengeId: ChallengeId;
    readonly completedAt: number;
    readonly score: ScoreResult;
    readonly earnedAchievements: readonly AchievementId[];
    readonly replayId: string;
    readonly difficulty: Difficulty;
}
/**
 * User progress across all challenges
 */
export interface UserProgress {
    readonly userId: string;
    readonly completions: readonly ChallengeCompletion[];
    readonly totalScore: number;
    readonly achievements: readonly AchievementId[];
    readonly lastPlayed?: ChallengeId;
}
/** Extract engine type from challenge */
export type EngineOfChallenge<C> = C extends ChallengeDefinition<infer E> ? E : never;
/** Extract state type from challenge */
export type StateOfChallenge<C> = C extends ChallengeDefinition<infer E> ? StateOf<E> : never;
/** Extract move type from challenge */
export type MoveOfChallenge<C> = C extends ChallengeDefinition<infer E> ? MoveOf<E> : never;
/** Extract board type from challenge */
export type BoardOfChallenge<C> = C extends ChallengeDefinition<infer E> ? BoardOf<E> : never;
/** Create typed challenge from engine */
export type ChallengeFor<E extends GameEngine<GameState, unknown, Record<string, unknown>, unknown>> = ChallengeDefinition<E>;
export {};
//# sourceMappingURL=challenge.d.ts.map