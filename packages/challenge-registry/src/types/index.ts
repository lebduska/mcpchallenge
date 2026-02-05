/**
 * Challenge Registry Types
 *
 * Complete type definitions for the challenge system.
 * No business logic - types only.
 */

// Engine types
export type {
  SerializedState,
  Seed,
  GameId,
  GameStatus,
  Turn,
  Difficulty,
  BaseGameState,
  GameState,
  GameResult,
  MoveResult,
  MoveSuccess,
  MoveFailure,
  RenderedState,
  GameEngine,
  StateOf,
  MoveOf,
  OptionsOf,
  BoardOf,
  EngineType,
} from './engine';

// Replay types
export type {
  ReplayId,
  EventSeq,
  RelativeTimestamp,
  ReplayEventType,
  GameStartEvent,
  PlayerMoveEvent,
  AIMoveEvent,
  GameEndEvent,
  GameEndReason,
  ResignEvent,
  TimeoutEvent,
  UndoEvent,
  ErrorEvent,
  ReplayEvent,
  ReplayMeta,
  ClientInfo,
  GameReplay,
  ReplayValidationResult,
  ReplayValid,
  ReplayInvalid,
  ReplayValidationError,
  ReplayErrorCode,
  MoveOfReplay,
  ReplayFor,
} from './replay';

// Replay type guards
export {
  isGameStartEvent,
  isPlayerMoveEvent,
  isAIMoveEvent,
  isMoveEvent,
  isGameEndEvent,
  isTerminalEvent,
} from './replay';

// Challenge types
export type {
  ChallengeId,
  AchievementId,
  ChallengeDifficulty,
  LearningConcept,
  ChallengeMeta,
  AchievementRarity,
  AchievementDefinition,
  AchievementChecker,
  AchievementContext,
  GameStats,
  ScoringConfig,
  ScoreResult,
  ScoreBonus,
  BoardRenderer,
  ChallengeDefinition,
  ChallengeMap,
  ChallengeCompletion,
  UserProgress,
  EngineOfChallenge,
  StateOfChallenge,
  MoveOfChallenge,
  BoardOfChallenge,
  ChallengeFor,
} from './challenge';

// Domain Events
export type {
  SessionId as DomainSessionId,
  EventId,
  EventSeq as DomainEventSeq,
  EventTimestamp,
  DomainEventType,
  SessionCreatedEvent,
  SessionRestoredEvent,
  MoveValidatedEvent,
  MoveExecutedEvent,
  AIThinkingEvent,
  AIMovedEvent,
  GameStateChangedEvent,
  GameCompletedEvent,
  AchievementEarnedEvent,
  AchievementEvaluationCompleteEvent,
  SessionExpiredEvent,
  DomainErrorEvent,
  DomainEvent,
} from './domain-events';

export {
  isSessionCreatedEvent,
  isSessionRestoredEvent,
  isMoveValidatedEvent,
  isMoveExecutedEvent,
  isAIThinkingEvent,
  isAIMovedEvent,
  isGameStateChangedEvent,
  isGameCompletedEvent,
  isAchievementEarnedEvent,
  isAchievementEvaluationCompleteEvent,
  isSessionExpiredEvent,
  isDomainErrorEvent,
  createDomainEvent,
  generateEventId,
  parseEventId,
  serializeDomainEvent,
  parseDomainEvent,
} from './domain-events';
