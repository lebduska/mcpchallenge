/**
 * Challenge Registry
 *
 * Type-safe registry for challenge definitions with extensibility.
 */
import type { GameEngine, GameState, Difficulty } from '../types/engine';
import type { ChallengeId, ChallengeDefinition, ChallengeMeta, ChallengeDifficulty, LearningConcept } from '../types/challenge';
/**
 * Filter criteria for listing challenges
 */
export interface ChallengeFilter {
    /** Filter by difficulty range */
    readonly difficulty?: {
        readonly min?: ChallengeDifficulty;
        readonly max?: ChallengeDifficulty;
    };
    /** Filter by learning concepts (any match) */
    readonly concepts?: readonly LearningConcept[];
    /** Filter by tags (any match) */
    readonly tags?: readonly string[];
    /** Filter by engine difficulty support */
    readonly engineDifficulty?: Difficulty;
    /** Custom filter function */
    readonly custom?: (challenge: ChallengeDefinition<any>) => boolean;
}
/**
 * Sort options for listing challenges
 */
export interface ChallengeSortOptions {
    readonly by: 'name' | 'difficulty' | 'points' | 'registeredAt';
    readonly order?: 'asc' | 'desc';
}
/**
 * Challenge listing result
 */
export interface ChallengeListItem {
    readonly id: ChallengeId;
    readonly meta: ChallengeMeta;
    readonly difficulties: readonly Difficulty[];
    readonly achievementCount: number;
    readonly basePoints: number;
}
/**
 * Registry event types
 */
export type RegistryEventType = 'registered' | 'unregistered' | 'updated';
export interface RegistryEvent {
    readonly type: RegistryEventType;
    readonly challengeId: ChallengeId;
    readonly timestamp: number;
}
export type RegistryEventHandler = (event: RegistryEvent) => void;
/**
 * Registration options
 */
export interface RegisterOptions {
    /** Override if already exists */
    readonly override?: boolean;
}
/**
 * Registry statistics
 */
export interface RegistryStats {
    readonly totalChallenges: number;
    readonly byDifficulty: Record<ChallengeDifficulty, number>;
    readonly byConcept: Record<LearningConcept, number>;
    readonly totalAchievements: number;
    readonly totalPoints: number;
}
/**
 * Type-safe challenge registry with extensibility
 */
export declare class ChallengeRegistry {
    private readonly challenges;
    private readonly eventHandlers;
    private readonly registrationOrder;
    /**
     * Register a challenge
     *
     * @throws Error if challenge already exists (unless override=true)
     */
    register<TEngine extends GameEngine<GameState, unknown, Record<string, unknown>, unknown>>(challenge: ChallengeDefinition<TEngine>, options?: RegisterOptions): this;
    /**
     * Register multiple challenges
     */
    registerAll(challenges: readonly ChallengeDefinition<any>[], options?: RegisterOptions): this;
    /**
     * Unregister a challenge
     */
    unregister(id: ChallengeId): boolean;
    /**
     * Get a challenge by ID with full type inference
     */
    getChallenge<TEngine extends GameEngine<GameState, unknown, Record<string, unknown>, unknown>>(id: ChallengeId): ChallengeDefinition<TEngine> | undefined;
    /**
     * Get a challenge by ID, throwing if not found
     */
    getChallengeOrThrow<TEngine extends GameEngine<GameState, unknown, Record<string, unknown>, unknown>>(id: ChallengeId): ChallengeDefinition<TEngine>;
    /**
     * Check if a challenge exists
     */
    has(id: ChallengeId): boolean;
    /**
     * List all challenges with optional filtering and sorting
     */
    listChallenges(filter?: ChallengeFilter, sort?: ChallengeSortOptions): readonly ChallengeListItem[];
    /**
     * Get challenges by difficulty
     */
    getByDifficulty(difficulty: ChallengeDifficulty): readonly ChallengeListItem[];
    /**
     * Get challenges by learning concept
     */
    getByConcept(concept: LearningConcept): readonly ChallengeListItem[];
    /**
     * Get challenges by tag
     */
    getByTag(tag: string): readonly ChallengeListItem[];
    /**
     * Get all challenge IDs
     */
    getIds(): readonly ChallengeId[];
    /**
     * Get registry statistics
     */
    getStats(): RegistryStats;
    /**
     * Get count of registered challenges
     */
    get size(): number;
    /**
     * Clear all challenges
     */
    clear(): void;
    /**
     * Subscribe to registry events
     */
    on(handler: RegistryEventHandler): () => void;
    /**
     * Iterate over all challenges
     */
    [Symbol.iterator](): Iterator<ChallengeDefinition<any>>;
    /**
     * Export registry as plain object (for serialization)
     */
    toJSON(): Record<string, ChallengeListItem>;
    private matchesFilter;
    private sortChallenges;
    private toListItem;
    private emit;
}
/**
 * Create a new challenge registry
 */
export declare function createChallengeRegistry(): ChallengeRegistry;
/**
 * Get the global challenge registry
 */
export declare function getGlobalRegistry(): ChallengeRegistry;
/**
 * Reset the global registry (for testing)
 */
export declare function resetGlobalRegistry(): void;
//# sourceMappingURL=challenge-registry.d.ts.map