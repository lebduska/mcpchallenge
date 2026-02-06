/**
 * Services Module
 *
 * Clean, testable services for challenge execution.
 */
export { SessionManager, createSessionManager, type SessionId, type SessionStatus, type Session, type CreateSessionInput, type UpdateSessionInput, type SessionQueryOptions, type SessionResult, type SessionError, type SessionErrorCode, } from './session-manager';
export { ReplayRecorder, createReplayRecorder, createGameStartEvent, createPlayerMoveEvent, createAIMoveEvent, createGameEndEvent, buildReplay, type RecordingContext, type GameStartInput, type PlayerMoveInput, type AIMoveInput, type GameEndInput, type BuildReplayInput, } from './replay-recorder';
export { EngineExecutor, createEngineExecutor, type ExecuteMoveResult, type ExecuteMoveSuccess, type ExecuteMoveFailure, type ExecutionError, type ExecutionErrorCode, type AIResult, type AISuccess, type AINoMove, type InitGameResult, type StateInfo, } from './engine-executor';
export { ChallengeValidator, createChallengeValidator, validateChallengeExists, validateDifficulty, validateSessionState, validateRequiredString, validateEnum, type ValidationResult, type ValidationSuccess, type ValidationFailure, type ValidationError, type ValidationErrorCode, } from './challenge-validator';
export { AchievementEvaluator, createAchievementEvaluator, createAchievementEvaluatorFromRegistry, type EvaluationInput, type EvaluationOutput, type EvaluationSummary, type AchievementProgress, } from './achievement-evaluator';
export { EventCollector, createEventCollector, createEventCollectorFromString, getCurrentSeq, resetSeq, } from './event-collector';
export { EventBuffer, getEventBuffer, createEventBuffer, resetEventBuffer, type EventBufferOptions, } from './event-buffer';
//# sourceMappingURL=index.d.ts.map