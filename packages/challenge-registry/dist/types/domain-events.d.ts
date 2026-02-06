/**
 * Domain Events
 *
 * Events emitted by the MCP orchestrator for UI integration.
 * Distinct from ReplayEvents (game moves) - these are orchestrator-level events.
 */
import type { ChallengeId, AchievementId } from './challenge';
import type { GameResult, Difficulty, Turn } from './engine';
/**
 * Session identifier (from session-manager)
 */
export type SessionId = string & {
    readonly __brand: 'SessionId';
};
/**
 * Event identifier (unique per session, monotonic)
 */
export type EventId = string & {
    readonly __brand: 'EventId';
};
/**
 * Event sequence number (for ordering and reconnect)
 */
export type EventSeq = number & {
    readonly __brand: 'EventSeq';
};
/**
 * Event timestamp (Unix ms)
 */
export type EventTimestamp = number;
/**
 * Domain event types
 */
export type DomainEventType = 'session_created' | 'session_restored' | 'move_validated' | 'move_executed' | 'ai_thinking' | 'ai_moved' | 'game_state_changed' | 'game_completed' | 'achievement_earned' | 'achievement_evaluation_complete' | 'session_expired' | 'error';
interface BaseDomainEvent<T extends DomainEventType> {
    readonly id: EventId;
    readonly seq: EventSeq;
    readonly type: T;
    readonly timestamp: EventTimestamp;
    readonly sessionId: SessionId;
}
export interface SessionCreatedEvent extends BaseDomainEvent<'session_created'> {
    readonly payload: {
        readonly challengeId: ChallengeId;
        readonly difficulty: Difficulty;
        readonly seed: string;
    };
}
export interface SessionRestoredEvent extends BaseDomainEvent<'session_restored'> {
    readonly payload: {
        readonly challengeId: ChallengeId;
        readonly moveCount: number;
    };
}
export interface MoveValidatedEvent extends BaseDomainEvent<'move_validated'> {
    readonly payload: {
        readonly move: string;
        readonly valid: boolean;
        readonly error?: string;
    };
}
export interface MoveExecutedEvent extends BaseDomainEvent<'move_executed'> {
    readonly payload: {
        readonly move: string;
        readonly turn: Turn;
        readonly moveCount: number;
    };
}
export interface AIThinkingEvent extends BaseDomainEvent<'ai_thinking'> {
    readonly payload: {
        readonly difficulty: Difficulty;
    };
}
export interface AIMovedEvent extends BaseDomainEvent<'ai_moved'> {
    readonly payload: {
        readonly move: string;
        readonly thinkTimeMs?: number;
    };
}
export interface GameStateChangedEvent extends BaseDomainEvent<'game_state_changed'> {
    readonly payload: {
        readonly turn: Turn;
        readonly moveCount: number;
        readonly gameOver: boolean;
        readonly legalMoveCount: number;
    };
}
export interface GameCompletedEvent extends BaseDomainEvent<'game_completed'> {
    readonly payload: {
        readonly result: GameResult;
        readonly replayId: string;
    };
}
export interface AchievementEarnedEvent extends BaseDomainEvent<'achievement_earned'> {
    readonly payload: {
        readonly achievementId: AchievementId;
        readonly name: string;
        readonly description: string;
        readonly points: number;
        readonly rarity: string;
        readonly icon?: string;
    };
}
export interface AchievementEvaluationCompleteEvent extends BaseDomainEvent<'achievement_evaluation_complete'> {
    readonly payload: {
        readonly totalEarned: number;
        readonly totalPoints: number;
    };
}
export interface SessionExpiredEvent extends BaseDomainEvent<'session_expired'> {
    readonly payload: {
        readonly reason: 'timeout' | 'manual' | 'error';
    };
}
export interface DomainErrorEvent extends BaseDomainEvent<'error'> {
    readonly payload: {
        readonly code: string;
        readonly message: string;
        readonly recoverable: boolean;
    };
}
export type DomainEvent = SessionCreatedEvent | SessionRestoredEvent | MoveValidatedEvent | MoveExecutedEvent | AIThinkingEvent | AIMovedEvent | GameStateChangedEvent | GameCompletedEvent | AchievementEarnedEvent | AchievementEvaluationCompleteEvent | SessionExpiredEvent | DomainErrorEvent;
export declare function isSessionCreatedEvent(e: DomainEvent): e is SessionCreatedEvent;
export declare function isSessionRestoredEvent(e: DomainEvent): e is SessionRestoredEvent;
export declare function isMoveValidatedEvent(e: DomainEvent): e is MoveValidatedEvent;
export declare function isMoveExecutedEvent(e: DomainEvent): e is MoveExecutedEvent;
export declare function isAIThinkingEvent(e: DomainEvent): e is AIThinkingEvent;
export declare function isAIMovedEvent(e: DomainEvent): e is AIMovedEvent;
export declare function isGameStateChangedEvent(e: DomainEvent): e is GameStateChangedEvent;
export declare function isGameCompletedEvent(e: DomainEvent): e is GameCompletedEvent;
export declare function isAchievementEarnedEvent(e: DomainEvent): e is AchievementEarnedEvent;
export declare function isAchievementEvaluationCompleteEvent(e: DomainEvent): e is AchievementEvaluationCompleteEvent;
export declare function isSessionExpiredEvent(e: DomainEvent): e is SessionExpiredEvent;
export declare function isDomainErrorEvent(e: DomainEvent): e is DomainErrorEvent;
type PayloadOf<T extends DomainEventType> = Extract<DomainEvent, {
    type: T;
}>['payload'];
/**
 * Generate unique event ID
 */
export declare function generateEventId(sessionId: SessionId, seq: EventSeq): EventId;
/**
 * Create a domain event with automatic id, seq, and timestamp
 */
export declare function createDomainEvent<T extends DomainEventType>(type: T, sessionId: SessionId, payload: PayloadOf<T>, seq: EventSeq): Extract<DomainEvent, {
    type: T;
}>;
/**
 * Extract sequence number from event ID
 */
export declare function parseEventId(eventId: EventId): {
    sessionId: SessionId;
    seq: EventSeq;
};
/**
 * Serialize event for SSE transmission
 */
export declare function serializeDomainEvent(event: DomainEvent): string;
/**
 * Parse event from SSE data
 */
export declare function parseDomainEvent(data: string): DomainEvent;
export {};
//# sourceMappingURL=domain-events.d.ts.map