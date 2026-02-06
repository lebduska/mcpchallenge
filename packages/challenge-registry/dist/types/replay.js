/**
 * Replay System Types
 *
 * Types for recording, storing, and replaying games.
 * All replay data must be serializable (JSON-safe).
 */
// =============================================================================
// Type Guards
// =============================================================================
export function isGameStartEvent(e) {
    return e.type === 'game_start';
}
export function isPlayerMoveEvent(e) {
    return e.type === 'player_move';
}
export function isAIMoveEvent(e) {
    return e.type === 'ai_move';
}
export function isMoveEvent(e) {
    return e.type === 'player_move' || e.type === 'ai_move';
}
export function isGameEndEvent(e) {
    return e.type === 'game_end';
}
export function isTerminalEvent(e) {
    return e.type === 'game_end' || e.type === 'resign' || e.type === 'timeout';
}
//# sourceMappingURL=replay.js.map