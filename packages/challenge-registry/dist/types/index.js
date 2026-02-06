/**
 * Challenge Registry Types
 *
 * Complete type definitions for the challenge system.
 * No business logic - types only.
 */
// Replay type guards
export { isGameStartEvent, isPlayerMoveEvent, isAIMoveEvent, isMoveEvent, isGameEndEvent, isTerminalEvent, } from './replay';
export { isSessionCreatedEvent, isSessionRestoredEvent, isMoveValidatedEvent, isMoveExecutedEvent, isAIThinkingEvent, isAIMovedEvent, isGameStateChangedEvent, isGameCompletedEvent, isAchievementEarnedEvent, isAchievementEvaluationCompleteEvent, isSessionExpiredEvent, isDomainErrorEvent, createDomainEvent, generateEventId, parseEventId, serializeDomainEvent, parseDomainEvent, } from './domain-events';
//# sourceMappingURL=index.js.map