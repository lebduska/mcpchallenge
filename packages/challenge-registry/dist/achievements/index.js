/**
 * Achievements Module
 *
 * Rule-based achievement evaluation over Replay data.
 */
// Engine
export { AchievementEngine, createAchievementEngine, computeGameStats, } from './achievement-engine';
// Builder
export { AchievementBuilder, achievement, } from './achievement-engine';
// Rule builders
export { outcome, moves, time, mistakes, patterns, custom, } from './achievement-engine';
// Composition
export { all, any, not, } from './achievement-engine';
//# sourceMappingURL=index.js.map