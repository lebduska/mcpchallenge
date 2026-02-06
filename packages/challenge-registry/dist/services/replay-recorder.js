/**
 * Replay Recorder
 *
 * Records game events into replay format.
 * Pure functions for event creation and replay building.
 */
// =============================================================================
// Event Creators (Pure Functions)
// =============================================================================
/**
 * Create game start event
 */
export function createGameStartEvent(ctx, input) {
    return {
        seq: ctx.eventCount,
        timestamp: 0,
        type: 'game_start',
        payload: {
            options: input.options,
            seed: input.seed,
            initialState: input.initialState,
        },
    };
}
/**
 * Create player move event
 */
export function createPlayerMoveEvent(ctx, input) {
    const timestamp = Date.now() - ctx.startTime;
    return {
        seq: ctx.eventCount,
        timestamp: timestamp,
        type: 'player_move',
        payload: {
            move: input.move,
            moveString: input.moveString,
            stateBefore: input.stateBefore,
            stateAfter: input.stateAfter,
        },
    };
}
/**
 * Create AI move event
 */
export function createAIMoveEvent(ctx, input) {
    const timestamp = Date.now() - ctx.startTime;
    return {
        seq: ctx.eventCount,
        timestamp: timestamp,
        type: 'ai_move',
        payload: {
            move: input.move,
            moveString: input.moveString,
            stateBefore: input.stateBefore,
            stateAfter: input.stateAfter,
            thinkTimeMs: input.thinkTimeMs,
        },
    };
}
/**
 * Create game end event
 */
export function createGameEndEvent(ctx, input) {
    const timestamp = Date.now() - ctx.startTime;
    return {
        seq: ctx.eventCount,
        timestamp: timestamp,
        type: 'game_end',
        payload: {
            result: input.result,
            finalState: input.finalState,
            reason: input.reason,
        },
    };
}
// =============================================================================
// Replay Builder (Pure Function)
// =============================================================================
/**
 * Build complete replay from events
 */
export function buildReplay(input) {
    const endTime = input.endTime ?? Date.now();
    const duration = endTime - input.startTime;
    // Count moves
    let playerMoves = 0;
    let aiMoves = 0;
    for (const event of input.events) {
        if (event.type === 'player_move')
            playerMoves++;
        if (event.type === 'ai_move')
            aiMoves++;
    }
    const meta = {
        createdAt: input.startTime,
        completedAt: endTime,
        playerMoves,
        aiMoves,
        duration,
    };
    return {
        version: '1.0',
        replayId: generateReplayId(),
        challengeId: input.challengeId,
        gameId: input.gameId,
        userId: input.userId,
        seed: input.seed,
        options: input.options,
        events: input.events,
        result: input.result,
        meta,
    };
}
// =============================================================================
// Replay Recorder Class
// =============================================================================
/**
 * Stateful replay recorder
 *
 * Wraps pure functions with mutable context.
 * Use for imperative recording during gameplay.
 */
export class ReplayRecorder {
    startTime;
    events = [];
    constructor() {
        this.startTime = Date.now();
    }
    /**
     * Get current recording context
     */
    getContext() {
        return {
            startTime: this.startTime,
            eventCount: this.events.length,
        };
    }
    /**
     * Record game start
     */
    recordStart(input) {
        const event = createGameStartEvent(this.getContext(), input);
        this.events.push(event);
        return event;
    }
    /**
     * Record player move
     */
    recordPlayerMove(input) {
        const event = createPlayerMoveEvent(this.getContext(), input);
        this.events.push(event);
        return event;
    }
    /**
     * Record AI move
     */
    recordAIMove(input) {
        const event = createAIMoveEvent(this.getContext(), input);
        this.events.push(event);
        return event;
    }
    /**
     * Record game end
     */
    recordEnd(input) {
        const event = createGameEndEvent(this.getContext(), input);
        this.events.push(event);
        return event;
    }
    /**
     * Get all recorded events
     */
    getEvents() {
        return [...this.events];
    }
    /**
     * Get event count
     */
    get eventCount() {
        return this.events.length;
    }
    /**
     * Get recording start time
     */
    get recordingStartTime() {
        return this.startTime;
    }
    /**
     * Build final replay
     */
    build(input) {
        return buildReplay({
            ...input,
            events: this.events,
            startTime: this.startTime,
        });
    }
}
// =============================================================================
// Factory & Utilities
// =============================================================================
export function createReplayRecorder() {
    return new ReplayRecorder();
}
function generateReplayId() {
    return `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
//# sourceMappingURL=replay-recorder.js.map