/**
 * Challenge Registry
 *
 * Type-safe registry for challenge definitions with extensibility.
 */

import type {
  GameEngine,
  GameState,
  Difficulty,
} from '../types/engine';
import type {
  ChallengeId,
  ChallengeDefinition,
  ChallengeMeta,
  ChallengeDifficulty,
  LearningConcept,
} from '../types/challenge';

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Challenge Registry
// =============================================================================

/**
 * Type-safe challenge registry with extensibility
 */
export class ChallengeRegistry {
  private readonly challenges: Map<string, ChallengeDefinition<any>> = new Map();
  private readonly eventHandlers: Set<RegistryEventHandler> = new Set();
  private readonly registrationOrder: string[] = [];

  /**
   * Register a challenge
   *
   * @throws Error if challenge already exists (unless override=true)
   */
  register<TEngine extends GameEngine<GameState, unknown, Record<string, unknown>, unknown>>(
    challenge: ChallengeDefinition<TEngine>,
    options: RegisterOptions = {}
  ): this {
    const id = challenge.id as string;

    if (this.challenges.has(id) && !options.override) {
      throw new Error(`Challenge "${id}" is already registered. Use override option to replace.`);
    }

    const isUpdate = this.challenges.has(id);
    this.challenges.set(id, challenge);

    if (!isUpdate) {
      this.registrationOrder.push(id);
    }

    this.emit({
      type: isUpdate ? 'updated' : 'registered',
      challengeId: challenge.id,
      timestamp: Date.now(),
    });

    return this;
  }

  /**
   * Register multiple challenges
   */
  registerAll(
    challenges: readonly ChallengeDefinition<any>[],
    options: RegisterOptions = {}
  ): this {
    for (const challenge of challenges) {
      this.register(challenge, options);
    }
    return this;
  }

  /**
   * Unregister a challenge
   */
  unregister(id: ChallengeId): boolean {
    const idStr = id as string;
    const existed = this.challenges.delete(idStr);

    if (existed) {
      const idx = this.registrationOrder.indexOf(idStr);
      if (idx !== -1) {
        this.registrationOrder.splice(idx, 1);
      }

      this.emit({
        type: 'unregistered',
        challengeId: id,
        timestamp: Date.now(),
      });
    }

    return existed;
  }

  /**
   * Get a challenge by ID with full type inference
   */
  getChallenge<TEngine extends GameEngine<GameState, unknown, Record<string, unknown>, unknown>>(
    id: ChallengeId
  ): ChallengeDefinition<TEngine> | undefined {
    return this.challenges.get(id as string) as ChallengeDefinition<TEngine> | undefined;
  }

  /**
   * Get a challenge by ID, throwing if not found
   */
  getChallengeOrThrow<TEngine extends GameEngine<GameState, unknown, Record<string, unknown>, unknown>>(
    id: ChallengeId
  ): ChallengeDefinition<TEngine> {
    const challenge = this.getChallenge<TEngine>(id);
    if (!challenge) {
      throw new Error(`Challenge "${id}" not found`);
    }
    return challenge;
  }

  /**
   * Check if a challenge exists
   */
  has(id: ChallengeId): boolean {
    return this.challenges.has(id as string);
  }

  /**
   * List all challenges with optional filtering and sorting
   */
  listChallenges(
    filter?: ChallengeFilter,
    sort?: ChallengeSortOptions
  ): readonly ChallengeListItem[] {
    let challenges = Array.from(this.challenges.values());

    // Apply filters
    if (filter) {
      challenges = challenges.filter((c) => this.matchesFilter(c, filter));
    }

    // Sort
    if (sort) {
      challenges = this.sortChallenges(challenges, sort);
    } else {
      // Default: registration order
      challenges = challenges.sort((a, b) => {
        const aIdx = this.registrationOrder.indexOf(a.id as string);
        const bIdx = this.registrationOrder.indexOf(b.id as string);
        return aIdx - bIdx;
      });
    }

    // Map to list items
    return challenges.map((c) => this.toListItem(c));
  }

  /**
   * Get challenges by difficulty
   */
  getByDifficulty(difficulty: ChallengeDifficulty): readonly ChallengeListItem[] {
    return this.listChallenges({
      difficulty: { min: difficulty, max: difficulty },
    });
  }

  /**
   * Get challenges by learning concept
   */
  getByConcept(concept: LearningConcept): readonly ChallengeListItem[] {
    return this.listChallenges({
      concepts: [concept],
    });
  }

  /**
   * Get challenges by tag
   */
  getByTag(tag: string): readonly ChallengeListItem[] {
    return this.listChallenges({
      tags: [tag],
    });
  }

  /**
   * Get all challenge IDs
   */
  getIds(): readonly ChallengeId[] {
    return this.registrationOrder.map((id) => id as ChallengeId);
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const byDifficulty: Record<ChallengeDifficulty, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };

    const byConcept: Record<LearningConcept, number> = {
      tool_basics: 0,
      state_management: 0,
      error_handling: 0,
      strategy: 0,
      optimization: 0,
      multi_step: 0,
      real_time: 0,
      resource_management: 0,
    };

    let totalAchievements = 0;
    let totalPoints = 0;

    for (const challenge of this.challenges.values()) {
      byDifficulty[challenge.meta.difficulty]++;

      for (const concept of challenge.meta.concepts) {
        byConcept[concept]++;
      }

      totalAchievements += challenge.achievements.length;
      totalPoints += challenge.scoring.basePoints;

      for (const achievement of challenge.achievements) {
        totalPoints += achievement.points;
      }
    }

    return {
      totalChallenges: this.challenges.size,
      byDifficulty,
      byConcept,
      totalAchievements,
      totalPoints,
    };
  }

  /**
   * Get count of registered challenges
   */
  get size(): number {
    return this.challenges.size;
  }

  /**
   * Clear all challenges
   */
  clear(): void {
    const ids = [...this.challenges.keys()];
    this.challenges.clear();
    this.registrationOrder.length = 0;

    for (const id of ids) {
      this.emit({
        type: 'unregistered',
        challengeId: id as ChallengeId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Subscribe to registry events
   */
  on(handler: RegistryEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Iterate over all challenges
   */
  *[Symbol.iterator](): Iterator<ChallengeDefinition<any>> {
    for (const id of this.registrationOrder) {
      const challenge = this.challenges.get(id);
      if (challenge) {
        yield challenge;
      }
    }
  }

  /**
   * Export registry as plain object (for serialization)
   */
  toJSON(): Record<string, ChallengeListItem> {
    const result: Record<string, ChallengeListItem> = {};
    for (const challenge of this.challenges.values()) {
      result[challenge.id as string] = this.toListItem(challenge);
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private matchesFilter(
    challenge: ChallengeDefinition<any>,
    filter: ChallengeFilter
  ): boolean {
    // Difficulty filter
    if (filter.difficulty) {
      const diff = challenge.meta.difficulty;
      if (filter.difficulty.min !== undefined && diff < filter.difficulty.min) {
        return false;
      }
      if (filter.difficulty.max !== undefined && diff > filter.difficulty.max) {
        return false;
      }
    }

    // Concepts filter (any match)
    if (filter.concepts && filter.concepts.length > 0) {
      const hasConcept = filter.concepts.some((c) =>
        challenge.meta.concepts.includes(c)
      );
      if (!hasConcept) {
        return false;
      }
    }

    // Tags filter (any match)
    if (filter.tags && filter.tags.length > 0) {
      const challengeTags = challenge.meta.tags ?? [];
      const hasTag = filter.tags.some((t) => challengeTags.includes(t));
      if (!hasTag) {
        return false;
      }
    }

    // Engine difficulty filter
    if (filter.engineDifficulty) {
      if (!challenge.difficulties.includes(filter.engineDifficulty)) {
        return false;
      }
    }

    // Custom filter
    if (filter.custom && !filter.custom(challenge)) {
      return false;
    }

    return true;
  }

  private sortChallenges(
    challenges: ChallengeDefinition<any>[],
    sort: ChallengeSortOptions
  ): ChallengeDefinition<any>[] {
    const multiplier = sort.order === 'desc' ? -1 : 1;

    return [...challenges].sort((a, b) => {
      let cmp = 0;

      switch (sort.by) {
        case 'name':
          cmp = a.meta.name.localeCompare(b.meta.name);
          break;
        case 'difficulty':
          cmp = a.meta.difficulty - b.meta.difficulty;
          break;
        case 'points':
          cmp = a.scoring.basePoints - b.scoring.basePoints;
          break;
        case 'registeredAt':
          cmp = this.registrationOrder.indexOf(a.id as string) -
                this.registrationOrder.indexOf(b.id as string);
          break;
      }

      return cmp * multiplier;
    });
  }

  private toListItem(challenge: ChallengeDefinition<any>): ChallengeListItem {
    return {
      id: challenge.id,
      meta: challenge.meta,
      difficulties: challenge.difficulties,
      achievementCount: challenge.achievements.length,
      basePoints: challenge.scoring.basePoints,
    };
  }

  private emit(event: RegistryEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }
}

// =============================================================================
// Factory & Singleton
// =============================================================================

/**
 * Create a new challenge registry
 */
export function createChallengeRegistry(): ChallengeRegistry {
  return new ChallengeRegistry();
}

/**
 * Global registry instance (lazy initialized)
 */
let globalRegistry: ChallengeRegistry | null = null;

/**
 * Get the global challenge registry
 */
export function getGlobalRegistry(): ChallengeRegistry {
  if (!globalRegistry) {
    globalRegistry = createChallengeRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (for testing)
 */
export function resetGlobalRegistry(): void {
  globalRegistry?.clear();
  globalRegistry = null;
}
