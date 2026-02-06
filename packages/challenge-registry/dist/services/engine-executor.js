/**
 * Engine Executor
 *
 * Executes game operations on GameEngine.
 * Pure wrapper with no state management.
 */
// =============================================================================
// Engine Executor
// =============================================================================
/**
 * Executes operations on a GameEngine
 *
 * Responsibilities:
 * - Initialize games
 * - Execute player moves
 * - Execute AI moves
 * - Query game state
 *
 * NOT responsible for:
 * - Session management
 * - Replay recording
 * - Achievement evaluation
 */
export class EngineExecutor {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    /**
     * Initialize a new game
     */
    initGame(options, seed) {
        const state = this.engine.newGame(options, seed);
        return {
            state,
            serialized: this.engine.serialize(state),
            legalMoves: this.formatLegalMoves(state),
        };
    }
    /**
     * Execute a player move
     */
    executeMove(state, moveInput) {
        // Check if game is over
        if (this.engine.isGameOver(state)) {
            return {
                ok: false,
                error: {
                    code: 'GAME_ALREADY_OVER',
                    message: 'Game is already over',
                },
            };
        }
        // Check turn
        if (state.turn !== 'player') {
            return {
                ok: false,
                error: {
                    code: 'NOT_PLAYER_TURN',
                    message: 'Not player turn',
                },
            };
        }
        // Parse move
        const move = this.engine.parseMove(moveInput, state);
        if (!move) {
            return {
                ok: false,
                error: {
                    code: 'INVALID_MOVE_FORMAT',
                    message: `Invalid move format: ${moveInput}`,
                    details: { input: moveInput, legalMoves: this.formatLegalMoves(state) },
                },
            };
        }
        // Check legality
        if (!this.engine.isLegalMove(state, move)) {
            return {
                ok: false,
                error: {
                    code: 'ILLEGAL_MOVE',
                    message: `Illegal move: ${moveInput}`,
                    details: { input: moveInput, legalMoves: this.formatLegalMoves(state) },
                },
            };
        }
        // Execute
        const stateBefore = this.engine.serialize(state);
        const result = this.engine.makeMove(state, move);
        if (!result.valid) {
            return {
                ok: false,
                error: {
                    code: 'ENGINE_ERROR',
                    message: result.error ?? 'Engine rejected the move',
                },
            };
        }
        return {
            ok: true,
            state: result.state,
            move,
            moveString: this.engine.formatMove(move),
            stateBefore,
            stateAfter: this.engine.serialize(result.state),
            gameOver: this.engine.isGameOver(result.state),
            result: result.result ?? null,
        };
    }
    /**
     * Execute AI move
     */
    executeAI(state, difficulty, seed) {
        // Get AI move
        const move = this.engine.getAIMove(state, difficulty, seed);
        if (!move) {
            return { hasMove: false };
        }
        // Execute
        const stateBefore = this.engine.serialize(state);
        const result = this.engine.makeMove(state, move);
        if (!result.valid) {
            // AI made invalid move - should never happen
            return { hasMove: false };
        }
        return {
            hasMove: true,
            state: result.state,
            move,
            moveString: this.engine.formatMove(move),
            stateBefore,
            stateAfter: this.engine.serialize(result.state),
            gameOver: this.engine.isGameOver(result.state),
            result: result.result ?? null,
        };
    }
    /**
     * Get state info
     */
    getStateInfo(state) {
        return {
            state,
            serialized: this.engine.serialize(state),
            rendered: this.engine.renderText(state),
            legalMoves: this.formatLegalMoves(state),
            turn: state.turn,
            gameOver: this.engine.isGameOver(state),
            result: this.engine.getResult(state),
        };
    }
    /**
     * Check if game is over
     */
    isGameOver(state) {
        return this.engine.isGameOver(state);
    }
    /**
     * Get game result
     */
    getResult(state) {
        return this.engine.getResult(state);
    }
    /**
     * Get legal moves as strings
     */
    getLegalMoves(state) {
        return this.formatLegalMoves(state);
    }
    /**
     * Render state as text
     */
    renderText(state) {
        return this.engine.renderText(state);
    }
    /**
     * Serialize state
     */
    serialize(state) {
        return this.engine.serialize(state);
    }
    // ---------------------------------------------------------------------------
    // Private
    // ---------------------------------------------------------------------------
    formatLegalMoves(state) {
        return this.engine.getLegalMoves(state).map((m) => this.engine.formatMove(m));
    }
}
// =============================================================================
// Factory
// =============================================================================
export function createEngineExecutor(engine) {
    return new EngineExecutor(engine);
}
//# sourceMappingURL=engine-executor.js.map