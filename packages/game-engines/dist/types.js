/**
 * Core types for game engines
 *
 * All game engines implement the GameEngine interface, which provides:
 * - Pure game logic (no I/O, no side effects)
 * - Serializable state
 * - Text and JSON rendering for MCP responses
 */
// =============================================================================
// Utility Functions
// =============================================================================
/**
 * Generate a unique game ID
 */
export function generateGameId() {
    return crypto.randomUUID();
}
/**
 * Create a base game state
 */
export function createBaseState(gameId) {
    return {
        gameId: gameId ?? generateGameId(),
        status: 'playing',
        turn: 'player',
        moveCount: 0,
    };
}
//# sourceMappingURL=types.js.map