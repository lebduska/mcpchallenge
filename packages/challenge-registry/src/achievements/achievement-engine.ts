/**
 * Achievement Engine
 *
 * Rule-based achievement evaluation over Replay data.
 * Declarative, composable, type-safe.
 */

import type {
  GameResult,
  Difficulty,
} from '../types/engine';
import type {
  GameReplay,
  ReplayEvent,
  PlayerMoveEvent,
  AIMoveEvent,
  RelativeTimestamp,
} from '../types/replay';
import type {
  AchievementId,
  AchievementDefinition,
  AchievementRarity,
  AchievementContext,
  GameStats,
} from '../types/challenge';
import {
  isMoveEvent,
  isPlayerMoveEvent,
  isAIMoveEvent,
  isGameEndEvent,
} from '../types/replay';

// =============================================================================
// Rule Types
// =============================================================================

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
export type CompositeRule<TMove = unknown> =
  | AndRule<TMove>
  | OrRule<TMove>
  | NotRule<TMove>;

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

// =============================================================================
// Rule Builders
// =============================================================================

/**
 * Game outcome rules
 */
export const outcome = {
  /** Player won the game */
  won(): AchievementRule {
    return {
      type: 'outcome.won',
      evaluate: (ctx) => ctx.result.status === 'won',
      describe: () => 'Win the game',
    };
  },

  /** Player lost the game */
  lost(): AchievementRule {
    return {
      type: 'outcome.lost',
      evaluate: (ctx) => ctx.result.status === 'lost',
      describe: () => 'Lose the game',
    };
  },

  /** Game ended in draw */
  draw(): AchievementRule {
    return {
      type: 'outcome.draw',
      evaluate: (ctx) => ctx.result.status === 'draw',
      describe: () => 'Draw the game',
    };
  },

  /** Game completed (any outcome) */
  completed(): AchievementRule {
    return {
      type: 'outcome.completed',
      evaluate: (ctx) => ['won', 'lost', 'draw'].includes(ctx.result.status),
      describe: () => 'Complete the game',
    };
  },

  /** Won with specific score */
  wonWithScore(minScore: number): AchievementRule {
    return {
      type: 'outcome.wonWithScore',
      evaluate: (ctx) => ctx.result.status === 'won' && (ctx.result.score ?? 0) >= minScore,
      describe: () => `Win with score >= ${minScore}`,
    };
  },
};

/**
 * Move count rules
 */
export const moves = {
  /** Total moves (player + AI) */
  total(comparison: Comparison, value: number): AchievementRule {
    return {
      type: 'moves.total',
      evaluate: (ctx) => compare(ctx.stats.totalMoves, comparison, value),
      describe: () => `Total moves ${comparisonSymbol(comparison)} ${value}`,
    };
  },

  /** Player moves only */
  player(comparison: Comparison, value: number): AchievementRule {
    return {
      type: 'moves.player',
      evaluate: (ctx) => compare(ctx.stats.playerMoves, comparison, value),
      describe: () => `Player moves ${comparisonSymbol(comparison)} ${value}`,
    };
  },

  /** Won in exactly N moves */
  wonInMoves(maxMoves: number): AchievementRule {
    return {
      type: 'moves.wonInMoves',
      evaluate: (ctx) =>
        ctx.result.status === 'won' && ctx.stats.playerMoves <= maxMoves,
      describe: () => `Win in ${maxMoves} moves or less`,
    };
  },

  /** Perfect game (minimum possible moves) */
  perfect(optimalMoves: number): AchievementRule {
    return {
      type: 'moves.perfect',
      evaluate: (ctx) =>
        ctx.result.status === 'won' && ctx.stats.playerMoves === optimalMoves,
      describe: () => `Win in exactly ${optimalMoves} moves (perfect)`,
    };
  },
};

/**
 * Time-based rules
 */
export const time = {
  /** Total game duration */
  duration(comparison: Comparison, ms: number): AchievementRule {
    return {
      type: 'time.duration',
      evaluate: (ctx) => compare(ctx.stats.duration, comparison, ms),
      describe: () => `Game duration ${comparisonSymbol(comparison)} ${formatTime(ms)}`,
    };
  },

  /** Won within time limit */
  wonWithin(ms: number): AchievementRule {
    return {
      type: 'time.wonWithin',
      evaluate: (ctx) => ctx.result.status === 'won' && ctx.stats.duration <= ms,
      describe: () => `Win within ${formatTime(ms)}`,
    };
  },

  /** Average move time */
  averageMoveTime(comparison: Comparison, ms: number): AchievementRule {
    return {
      type: 'time.averageMoveTime',
      evaluate: (ctx) => compare(ctx.stats.averageMoveTime, comparison, ms),
      describe: () => `Average move time ${comparisonSymbol(comparison)} ${formatTime(ms)}`,
    };
  },

  /** Fastest move */
  fastestMove(comparison: Comparison, ms: number): AchievementRule {
    return {
      type: 'time.fastestMove',
      evaluate: (ctx) => compare(ctx.stats.fastestMove, comparison, ms),
      describe: () => `Fastest move ${comparisonSymbol(comparison)} ${formatTime(ms)}`,
    };
  },

  /** No move took longer than */
  noMoveLongerThan(ms: number): AchievementRule {
    return {
      type: 'time.noMoveLongerThan',
      evaluate: (ctx) => ctx.stats.slowestMove <= ms,
      describe: () => `No move longer than ${formatTime(ms)}`,
    };
  },
};

/**
 * Error/undo rules (for "clean" play achievements)
 */
export const mistakes = {
  /** No undos used */
  noUndos(): AchievementRule {
    return {
      type: 'mistakes.noUndos',
      evaluate: (ctx) => ctx.stats.undoCount === 0,
      describe: () => 'No undos used',
    };
  },

  /** No errors occurred */
  noErrors(): AchievementRule {
    return {
      type: 'mistakes.noErrors',
      evaluate: (ctx) => ctx.stats.errorCount === 0,
      describe: () => 'No errors occurred',
    };
  },

  /** Flawless (no undos, no errors, won) */
  flawless(): AchievementRule {
    return {
      type: 'mistakes.flawless',
      evaluate: (ctx) =>
        ctx.result.status === 'won' &&
        ctx.stats.undoCount === 0 &&
        ctx.stats.errorCount === 0,
      describe: () => 'Win without undos or errors',
    };
  },
};

/**
 * Replay event pattern rules
 */
export const patterns = {
  /** Check if a specific move pattern exists */
  hasMove<TMove>(predicate: (move: TMove, index: number) => boolean): AchievementRule<TMove> {
    return {
      type: 'patterns.hasMove',
      evaluate: (ctx) => {
        let idx = 0;
        for (const event of ctx.replay.events) {
          if (isPlayerMoveEvent(event)) {
            if (predicate(event.payload.move as TMove, idx)) {
              return true;
            }
            idx++;
          }
        }
        return false;
      },
      describe: () => 'Contains specific move pattern',
    };
  },

  /** All player moves match predicate */
  allMoves<TMove>(predicate: (move: TMove) => boolean): AchievementRule<TMove> {
    return {
      type: 'patterns.allMoves',
      evaluate: (ctx) => {
        for (const event of ctx.replay.events) {
          if (isPlayerMoveEvent(event)) {
            if (!predicate(event.payload.move as TMove)) {
              return false;
            }
          }
        }
        return true;
      },
      describe: () => 'All moves match pattern',
    };
  },

  /** Consecutive moves matching predicate */
  consecutiveMoves<TMove>(
    count: number,
    predicate: (move: TMove) => boolean
  ): AchievementRule<TMove> {
    return {
      type: 'patterns.consecutiveMoves',
      evaluate: (ctx) => {
        let streak = 0;
        for (const event of ctx.replay.events) {
          if (isPlayerMoveEvent(event)) {
            if (predicate(event.payload.move as TMove)) {
              streak++;
              if (streak >= count) return true;
            } else {
              streak = 0;
            }
          }
        }
        return false;
      },
      describe: () => `${count} consecutive moves matching pattern`,
    };
  },

  /** First move matches */
  firstMove<TMove>(predicate: (move: TMove) => boolean): AchievementRule<TMove> {
    return {
      type: 'patterns.firstMove',
      evaluate: (ctx) => {
        for (const event of ctx.replay.events) {
          if (isPlayerMoveEvent(event)) {
            return predicate(event.payload.move as TMove);
          }
        }
        return false;
      },
      describe: () => 'First move matches pattern',
    };
  },

  /** Last move matches */
  lastMove<TMove>(predicate: (move: TMove) => boolean): AchievementRule<TMove> {
    return {
      type: 'patterns.lastMove',
      evaluate: (ctx) => {
        let lastPlayerMove: TMove | null = null;
        for (const event of ctx.replay.events) {
          if (isPlayerMoveEvent(event)) {
            lastPlayerMove = event.payload.move as TMove;
          }
        }
        return lastPlayerMove !== null && predicate(lastPlayerMove);
      },
      describe: () => 'Last move matches pattern',
    };
  },
};

/**
 * Custom rule builder
 */
export function custom<TMove = unknown>(
  name: string,
  evaluate: (context: AchievementContext<TMove>) => boolean,
  description?: string
): AchievementRule<TMove> {
  return {
    type: `custom.${name}`,
    evaluate,
    describe: () => description ?? name,
  };
}

// =============================================================================
// Rule Composition
// =============================================================================

/**
 * All rules must pass (AND)
 */
export function all<TMove>(...rules: AchievementRule<TMove>[]): AchievementRule<TMove> {
  return {
    type: 'and',
    evaluate: (ctx) => rules.every((r) => r.evaluate(ctx)),
    describe: () => rules.map((r) => r.describe()).join(' AND '),
  };
}

/**
 * Any rule must pass (OR)
 */
export function any<TMove>(...rules: AchievementRule<TMove>[]): AchievementRule<TMove> {
  return {
    type: 'or',
    evaluate: (ctx) => rules.some((r) => r.evaluate(ctx)),
    describe: () => rules.map((r) => r.describe()).join(' OR '),
  };
}

/**
 * Negate a rule (NOT)
 */
export function not<TMove>(rule: AchievementRule<TMove>): AchievementRule<TMove> {
  return {
    type: 'not',
    evaluate: (ctx) => !rule.evaluate(ctx),
    describe: () => `NOT (${rule.describe()})`,
  };
}

// =============================================================================
// Achievement Builder
// =============================================================================

/**
 * Fluent builder for creating achievements
 */
export class AchievementBuilder<TMove = unknown> {
  private _id: string = '';
  private _name: string = '';
  private _description: string = '';
  private _rarity: AchievementRarity = 'common';
  private _points: number = 10;
  private _iconUrl?: string;
  private _hidden: boolean = false;
  private _rules: AchievementRule<TMove>[] = [];

  id(id: string): this {
    this._id = id;
    return this;
  }

  name(name: string): this {
    this._name = name;
    return this;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  rarity(rarity: AchievementRarity): this {
    this._rarity = rarity;
    return this;
  }

  points(points: number): this {
    this._points = points;
    return this;
  }

  icon(url: string): this {
    this._iconUrl = url;
    return this;
  }

  hidden(hidden: boolean = true): this {
    this._hidden = hidden;
    return this;
  }

  /**
   * Add a rule (multiple calls = AND)
   */
  when(rule: AchievementRule<TMove>): this {
    this._rules.push(rule);
    return this;
  }

  /**
   * Add multiple rules (AND)
   */
  whenAll(...rules: AchievementRule<TMove>[]): this {
    this._rules.push(...rules);
    return this;
  }

  /**
   * Add alternative rules (OR)
   */
  whenAny(...rules: AchievementRule<TMove>[]): this {
    this._rules.push(any(...rules));
    return this;
  }

  /**
   * Build the achievement definition
   */
  build(): AchievementDefinition<TMove> {
    if (!this._id) throw new Error('Achievement ID is required');
    if (!this._name) throw new Error('Achievement name is required');
    if (this._rules.length === 0) throw new Error('At least one rule is required');

    const combinedRule = this._rules.length === 1
      ? this._rules[0]
      : all(...this._rules);

    return {
      id: this._id as AchievementId,
      name: this._name,
      description: this._description || combinedRule.describe(),
      rarity: this._rarity,
      points: this._points,
      iconUrl: this._iconUrl,
      hidden: this._hidden,
      check: combinedRule.evaluate,
    };
  }
}

/**
 * Start building an achievement
 */
export function achievement<TMove = unknown>(): AchievementBuilder<TMove> {
  return new AchievementBuilder<TMove>();
}

// =============================================================================
// Achievement Engine
// =============================================================================

/**
 * Evaluate achievements against replay data
 */
export class AchievementEngine<TMove = unknown> {
  private readonly achievements: Map<string, AchievementDefinition<TMove>> = new Map();

  /**
   * Register achievements
   */
  register(...achievements: AchievementDefinition<TMove>[]): this {
    for (const ach of achievements) {
      this.achievements.set(ach.id as string, ach);
    }
    return this;
  }

  /**
   * Evaluate all achievements for a completed game
   */
  evaluate(result: GameResult, replay: GameReplay<TMove>): AchievementEvaluation {
    const stats = computeGameStats(replay);
    const context: AchievementContext<TMove> = { result, replay, stats };

    const earned: EarnedAchievement[] = [];
    const failed: FailedAchievement[] = [];

    for (const ach of this.achievements.values()) {
      try {
        const passed = ach.check(context);
        if (passed) {
          earned.push({
            id: ach.id,
            name: ach.name,
            description: ach.description,
            rarity: ach.rarity,
            points: ach.points,
          });
        } else if (!ach.hidden) {
          failed.push({
            id: ach.id,
            name: ach.name,
            description: ach.description,
          });
        }
      } catch (err) {
        // Achievement check failed - treat as not earned
        failed.push({
          id: ach.id,
          name: ach.name,
          description: ach.description,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Sort by rarity (rarest first) then points
    earned.sort((a, b) => {
      const rarityOrder: Record<AchievementRarity, number> = {
        legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4,
      };
      const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
      return rarityDiff !== 0 ? rarityDiff : b.points - a.points;
    });

    return {
      earned,
      failed,
      totalPoints: earned.reduce((sum, a) => sum + a.points, 0),
      stats,
    };
  }

  /**
   * Check a single achievement
   */
  check(
    achievementId: AchievementId,
    result: GameResult,
    replay: GameReplay<TMove>
  ): boolean {
    const ach = this.achievements.get(achievementId as string);
    if (!ach) return false;

    const stats = computeGameStats(replay);
    return ach.check({ result, replay, stats });
  }

  /**
   * Get all registered achievements
   */
  getAll(): readonly AchievementDefinition<TMove>[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get achievement by ID
   */
  get(id: AchievementId): AchievementDefinition<TMove> | undefined {
    return this.achievements.get(id as string);
  }
}

// =============================================================================
// Result Types
// =============================================================================

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

// =============================================================================
// Stats Computation
// =============================================================================

/**
 * Compute game statistics from replay
 */
export function computeGameStats<TMove>(replay: GameReplay<TMove>): GameStats {
  let playerMoves = 0;
  let aiMoves = 0;
  let undoCount = 0;
  let errorCount = 0;

  const moveTimes: number[] = [];
  let lastTimestamp = 0;

  for (const event of replay.events) {
    if (isPlayerMoveEvent(event)) {
      playerMoves++;
      if (lastTimestamp > 0) {
        moveTimes.push((event.timestamp as number) - lastTimestamp);
      }
      lastTimestamp = event.timestamp as number;
    } else if (isAIMoveEvent(event)) {
      aiMoves++;
      lastTimestamp = event.timestamp as number;
    } else if (event.type === 'undo') {
      undoCount++;
    } else if (event.type === 'error') {
      errorCount++;
    }
  }

  const duration = replay.meta.duration;
  const totalMoves = playerMoves + aiMoves;
  const averageMoveTime = moveTimes.length > 0
    ? moveTimes.reduce((a, b) => a + b, 0) / moveTimes.length
    : 0;
  const fastestMove = moveTimes.length > 0 ? Math.min(...moveTimes) : 0;
  const slowestMove = moveTimes.length > 0 ? Math.max(...moveTimes) : 0;

  return {
    totalMoves,
    playerMoves,
    aiMoves,
    duration,
    averageMoveTime,
    fastestMove,
    slowestMove,
    undoCount,
    errorCount,
  };
}

// =============================================================================
// Utilities
// =============================================================================

type Comparison = 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'neq';

function compare(actual: number, op: Comparison, expected: number): boolean {
  switch (op) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'lt': return actual < expected;
    case 'lte': return actual <= expected;
    case 'gt': return actual > expected;
    case 'gte': return actual >= expected;
  }
}

function comparisonSymbol(op: Comparison): string {
  switch (op) {
    case 'eq': return '=';
    case 'neq': return '≠';
    case 'lt': return '<';
    case 'lte': return '≤';
    case 'gt': return '>';
    case 'gte': return '≥';
  }
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a new achievement engine
 */
export function createAchievementEngine<TMove = unknown>(): AchievementEngine<TMove> {
  return new AchievementEngine<TMove>();
}
