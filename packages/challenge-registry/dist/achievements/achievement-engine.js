/**
 * Achievement Engine
 *
 * Rule-based achievement evaluation over Replay data.
 * Declarative, composable, type-safe.
 */
import { isPlayerMoveEvent, isAIMoveEvent, } from '../types/replay';
// =============================================================================
// Rule Builders
// =============================================================================
/**
 * Game outcome rules
 */
export const outcome = {
    /** Player won the game */
    won() {
        return {
            type: 'outcome.won',
            evaluate: (ctx) => ctx.result.status === 'won',
            describe: () => 'Win the game',
        };
    },
    /** Player lost the game */
    lost() {
        return {
            type: 'outcome.lost',
            evaluate: (ctx) => ctx.result.status === 'lost',
            describe: () => 'Lose the game',
        };
    },
    /** Game ended in draw */
    draw() {
        return {
            type: 'outcome.draw',
            evaluate: (ctx) => ctx.result.status === 'draw',
            describe: () => 'Draw the game',
        };
    },
    /** Game completed (any outcome) */
    completed() {
        return {
            type: 'outcome.completed',
            evaluate: (ctx) => ['won', 'lost', 'draw'].includes(ctx.result.status),
            describe: () => 'Complete the game',
        };
    },
    /** Won with specific score */
    wonWithScore(minScore) {
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
    total(comparison, value) {
        return {
            type: 'moves.total',
            evaluate: (ctx) => compare(ctx.stats.totalMoves, comparison, value),
            describe: () => `Total moves ${comparisonSymbol(comparison)} ${value}`,
        };
    },
    /** Player moves only */
    player(comparison, value) {
        return {
            type: 'moves.player',
            evaluate: (ctx) => compare(ctx.stats.playerMoves, comparison, value),
            describe: () => `Player moves ${comparisonSymbol(comparison)} ${value}`,
        };
    },
    /** Won in exactly N moves */
    wonInMoves(maxMoves) {
        return {
            type: 'moves.wonInMoves',
            evaluate: (ctx) => ctx.result.status === 'won' && ctx.stats.playerMoves <= maxMoves,
            describe: () => `Win in ${maxMoves} moves or less`,
        };
    },
    /** Perfect game (minimum possible moves) */
    perfect(optimalMoves) {
        return {
            type: 'moves.perfect',
            evaluate: (ctx) => ctx.result.status === 'won' && ctx.stats.playerMoves === optimalMoves,
            describe: () => `Win in exactly ${optimalMoves} moves (perfect)`,
        };
    },
};
/**
 * Time-based rules
 */
export const time = {
    /** Total game duration */
    duration(comparison, ms) {
        return {
            type: 'time.duration',
            evaluate: (ctx) => compare(ctx.stats.duration, comparison, ms),
            describe: () => `Game duration ${comparisonSymbol(comparison)} ${formatTime(ms)}`,
        };
    },
    /** Won within time limit */
    wonWithin(ms) {
        return {
            type: 'time.wonWithin',
            evaluate: (ctx) => ctx.result.status === 'won' && ctx.stats.duration <= ms,
            describe: () => `Win within ${formatTime(ms)}`,
        };
    },
    /** Average move time */
    averageMoveTime(comparison, ms) {
        return {
            type: 'time.averageMoveTime',
            evaluate: (ctx) => compare(ctx.stats.averageMoveTime, comparison, ms),
            describe: () => `Average move time ${comparisonSymbol(comparison)} ${formatTime(ms)}`,
        };
    },
    /** Fastest move */
    fastestMove(comparison, ms) {
        return {
            type: 'time.fastestMove',
            evaluate: (ctx) => compare(ctx.stats.fastestMove, comparison, ms),
            describe: () => `Fastest move ${comparisonSymbol(comparison)} ${formatTime(ms)}`,
        };
    },
    /** No move took longer than */
    noMoveLongerThan(ms) {
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
    noUndos() {
        return {
            type: 'mistakes.noUndos',
            evaluate: (ctx) => ctx.stats.undoCount === 0,
            describe: () => 'No undos used',
        };
    },
    /** No errors occurred */
    noErrors() {
        return {
            type: 'mistakes.noErrors',
            evaluate: (ctx) => ctx.stats.errorCount === 0,
            describe: () => 'No errors occurred',
        };
    },
    /** Flawless (no undos, no errors, won) */
    flawless() {
        return {
            type: 'mistakes.flawless',
            evaluate: (ctx) => ctx.result.status === 'won' &&
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
    hasMove(predicate) {
        return {
            type: 'patterns.hasMove',
            evaluate: (ctx) => {
                let idx = 0;
                for (const event of ctx.replay.events) {
                    if (isPlayerMoveEvent(event)) {
                        if (predicate(event.payload.move, idx)) {
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
    allMoves(predicate) {
        return {
            type: 'patterns.allMoves',
            evaluate: (ctx) => {
                for (const event of ctx.replay.events) {
                    if (isPlayerMoveEvent(event)) {
                        if (!predicate(event.payload.move)) {
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
    consecutiveMoves(count, predicate) {
        return {
            type: 'patterns.consecutiveMoves',
            evaluate: (ctx) => {
                let streak = 0;
                for (const event of ctx.replay.events) {
                    if (isPlayerMoveEvent(event)) {
                        if (predicate(event.payload.move)) {
                            streak++;
                            if (streak >= count)
                                return true;
                        }
                        else {
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
    firstMove(predicate) {
        return {
            type: 'patterns.firstMove',
            evaluate: (ctx) => {
                for (const event of ctx.replay.events) {
                    if (isPlayerMoveEvent(event)) {
                        return predicate(event.payload.move);
                    }
                }
                return false;
            },
            describe: () => 'First move matches pattern',
        };
    },
    /** Last move matches */
    lastMove(predicate) {
        return {
            type: 'patterns.lastMove',
            evaluate: (ctx) => {
                let lastPlayerMove = null;
                for (const event of ctx.replay.events) {
                    if (isPlayerMoveEvent(event)) {
                        lastPlayerMove = event.payload.move;
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
export function custom(name, evaluate, description) {
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
export function all(...rules) {
    return {
        type: 'and',
        evaluate: (ctx) => rules.every((r) => r.evaluate(ctx)),
        describe: () => rules.map((r) => r.describe()).join(' AND '),
    };
}
/**
 * Any rule must pass (OR)
 */
export function any(...rules) {
    return {
        type: 'or',
        evaluate: (ctx) => rules.some((r) => r.evaluate(ctx)),
        describe: () => rules.map((r) => r.describe()).join(' OR '),
    };
}
/**
 * Negate a rule (NOT)
 */
export function not(rule) {
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
export class AchievementBuilder {
    _id = '';
    _name = '';
    _description = '';
    _rarity = 'common';
    _points = 10;
    _iconUrl;
    _hidden = false;
    _rules = [];
    id(id) {
        this._id = id;
        return this;
    }
    name(name) {
        this._name = name;
        return this;
    }
    description(desc) {
        this._description = desc;
        return this;
    }
    rarity(rarity) {
        this._rarity = rarity;
        return this;
    }
    points(points) {
        this._points = points;
        return this;
    }
    icon(url) {
        this._iconUrl = url;
        return this;
    }
    hidden(hidden = true) {
        this._hidden = hidden;
        return this;
    }
    /**
     * Add a rule (multiple calls = AND)
     */
    when(rule) {
        this._rules.push(rule);
        return this;
    }
    /**
     * Add multiple rules (AND)
     */
    whenAll(...rules) {
        this._rules.push(...rules);
        return this;
    }
    /**
     * Add alternative rules (OR)
     */
    whenAny(...rules) {
        this._rules.push(any(...rules));
        return this;
    }
    /**
     * Build the achievement definition
     */
    build() {
        if (!this._id)
            throw new Error('Achievement ID is required');
        if (!this._name)
            throw new Error('Achievement name is required');
        if (this._rules.length === 0)
            throw new Error('At least one rule is required');
        const combinedRule = this._rules.length === 1
            ? this._rules[0]
            : all(...this._rules);
        return {
            id: this._id,
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
export function achievement() {
    return new AchievementBuilder();
}
// =============================================================================
// Achievement Engine
// =============================================================================
/**
 * Evaluate achievements against replay data
 */
export class AchievementEngine {
    achievements = new Map();
    /**
     * Register achievements
     */
    register(...achievements) {
        for (const ach of achievements) {
            this.achievements.set(ach.id, ach);
        }
        return this;
    }
    /**
     * Evaluate all achievements for a completed game
     */
    evaluate(result, replay) {
        const stats = computeGameStats(replay);
        const context = { result, replay, stats };
        const earned = [];
        const failed = [];
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
                }
                else if (!ach.hidden) {
                    failed.push({
                        id: ach.id,
                        name: ach.name,
                        description: ach.description,
                    });
                }
            }
            catch (err) {
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
            const rarityOrder = {
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
    check(achievementId, result, replay) {
        const ach = this.achievements.get(achievementId);
        if (!ach)
            return false;
        const stats = computeGameStats(replay);
        return ach.check({ result, replay, stats });
    }
    /**
     * Get all registered achievements
     */
    getAll() {
        return Array.from(this.achievements.values());
    }
    /**
     * Get achievement by ID
     */
    get(id) {
        return this.achievements.get(id);
    }
}
// =============================================================================
// Stats Computation
// =============================================================================
/**
 * Compute game statistics from replay
 */
export function computeGameStats(replay) {
    let playerMoves = 0;
    let aiMoves = 0;
    let undoCount = 0;
    let errorCount = 0;
    const moveTimes = [];
    let lastTimestamp = 0;
    for (const event of replay.events) {
        if (isPlayerMoveEvent(event)) {
            playerMoves++;
            if (lastTimestamp > 0) {
                moveTimes.push(event.timestamp - lastTimestamp);
            }
            lastTimestamp = event.timestamp;
        }
        else if (isAIMoveEvent(event)) {
            aiMoves++;
            lastTimestamp = event.timestamp;
        }
        else if (event.type === 'undo') {
            undoCount++;
        }
        else if (event.type === 'error') {
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
function compare(actual, op, expected) {
    switch (op) {
        case 'eq': return actual === expected;
        case 'neq': return actual !== expected;
        case 'lt': return actual < expected;
        case 'lte': return actual <= expected;
        case 'gt': return actual > expected;
        case 'gte': return actual >= expected;
    }
}
function comparisonSymbol(op) {
    switch (op) {
        case 'eq': return '=';
        case 'neq': return '≠';
        case 'lt': return '<';
        case 'lte': return '≤';
        case 'gt': return '>';
        case 'gte': return '≥';
    }
}
function formatTime(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
}
// =============================================================================
// Factory
// =============================================================================
/**
 * Create a new achievement engine
 */
export function createAchievementEngine() {
    return new AchievementEngine();
}
//# sourceMappingURL=achievement-engine.js.map