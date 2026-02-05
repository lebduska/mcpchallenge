/**
 * Services Module
 *
 * Clean, testable services for challenge execution.
 */

// Session Manager
export {
  SessionManager,
  createSessionManager,
  type SessionId,
  type SessionStatus,
  type Session,
  type CreateSessionInput,
  type UpdateSessionInput,
  type SessionQueryOptions,
  type SessionResult,
  type SessionError,
  type SessionErrorCode,
} from './session-manager';

// Replay Recorder
export {
  ReplayRecorder,
  createReplayRecorder,
  createGameStartEvent,
  createPlayerMoveEvent,
  createAIMoveEvent,
  createGameEndEvent,
  buildReplay,
  type RecordingContext,
  type GameStartInput,
  type PlayerMoveInput,
  type AIMoveInput,
  type GameEndInput,
  type BuildReplayInput,
} from './replay-recorder';

// Engine Executor
export {
  EngineExecutor,
  createEngineExecutor,
  type ExecuteMoveResult,
  type ExecuteMoveSuccess,
  type ExecuteMoveFailure,
  type ExecutionError,
  type ExecutionErrorCode,
  type AIResult,
  type AISuccess,
  type AINoMove,
  type InitGameResult,
  type StateInfo,
} from './engine-executor';

// Challenge Validator
export {
  ChallengeValidator,
  createChallengeValidator,
  validateChallengeExists,
  validateDifficulty,
  validateSessionState,
  validateRequiredString,
  validateEnum,
  type ValidationResult,
  type ValidationSuccess,
  type ValidationFailure,
  type ValidationError,
  type ValidationErrorCode,
} from './challenge-validator';

// Achievement Evaluator
export {
  AchievementEvaluator,
  createAchievementEvaluator,
  createAchievementEvaluatorFromRegistry,
  type EvaluationInput,
  type EvaluationOutput,
  type EvaluationSummary,
  type AchievementProgress,
} from './achievement-evaluator';

// Event Collector
export {
  EventCollector,
  createEventCollector,
  createEventCollectorFromString,
  getCurrentSeq,
  resetSeq,
} from './event-collector';

// Event Buffer
export {
  EventBuffer,
  getEventBuffer,
  createEventBuffer,
  resetEventBuffer,
  type EventBufferOptions,
} from './event-buffer';
