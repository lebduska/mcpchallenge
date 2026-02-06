/**
 * Domain Events
 *
 * Events emitted by the MCP orchestrator for UI integration.
 * Distinct from ReplayEvents (game moves) - these are orchestrator-level events.
 */
// =============================================================================
// Type Guards
// =============================================================================
export function isSessionCreatedEvent(e) {
    return e.type === 'session_created';
}
export function isSessionRestoredEvent(e) {
    return e.type === 'session_restored';
}
export function isMoveValidatedEvent(e) {
    return e.type === 'move_validated';
}
export function isMoveExecutedEvent(e) {
    return e.type === 'move_executed';
}
export function isAIThinkingEvent(e) {
    return e.type === 'ai_thinking';
}
export function isAIMovedEvent(e) {
    return e.type === 'ai_moved';
}
export function isGameStateChangedEvent(e) {
    return e.type === 'game_state_changed';
}
export function isGameCompletedEvent(e) {
    return e.type === 'game_completed';
}
export function isAchievementEarnedEvent(e) {
    return e.type === 'achievement_earned';
}
export function isAchievementEvaluationCompleteEvent(e) {
    return e.type === 'achievement_evaluation_complete';
}
export function isSessionExpiredEvent(e) {
    return e.type === 'session_expired';
}
export function isDomainErrorEvent(e) {
    return e.type === 'error';
}
let globalEventCounter = 0;
/**
 * Generate unique event ID
 */
export function generateEventId(sessionId, seq) {
    return `${sessionId}:${seq}`;
}
/**
 * Create a domain event with automatic id, seq, and timestamp
 */
export function createDomainEvent(type, sessionId, payload, seq) {
    const id = generateEventId(sessionId, seq);
    return {
        id,
        seq,
        type,
        timestamp: Date.now(),
        sessionId,
        payload,
    };
}
/**
 * Extract sequence number from event ID
 */
export function parseEventId(eventId) {
    const [sessionId, seqStr] = eventId.split(':');
    return {
        sessionId: sessionId,
        seq: parseInt(seqStr, 10),
    };
}
// =============================================================================
// Serialization
// =============================================================================
/**
 * Serialize event for SSE transmission
 */
export function serializeDomainEvent(event) {
    return JSON.stringify(event);
}
/**
 * Parse event from SSE data
 */
export function parseDomainEvent(data) {
    return JSON.parse(data);
}
//# sourceMappingURL=domain-events.js.map