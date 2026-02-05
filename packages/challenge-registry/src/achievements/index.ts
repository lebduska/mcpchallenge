/**
 * Achievements Module
 *
 * Rule-based achievement evaluation over Replay data.
 */

// Engine
export {
  AchievementEngine,
  createAchievementEngine,
  computeGameStats,
  type AchievementEvaluation,
  type EarnedAchievement,
  type FailedAchievement,
} from './achievement-engine';

// Builder
export {
  AchievementBuilder,
  achievement,
  type AchievementRule,
} from './achievement-engine';

// Rule builders
export {
  outcome,
  moves,
  time,
  mistakes,
  patterns,
  custom,
} from './achievement-engine';

// Composition
export {
  all,
  any,
  not,
} from './achievement-engine';
