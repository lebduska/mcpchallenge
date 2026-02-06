/**
 * Challenge Registry MCP Adapter
 *
 * Type-safe MCP tool definitions generated from ChallengeRegistry.
 * No chaos - single source of truth.
 */
import { AchievementEngine, computeGameStats } from '../achievements';
// =============================================================================
// Generated Tool Names (const for type safety)
// =============================================================================
export const REGISTRY_TOOLS = {
    LIST_CHALLENGES: 'list_challenges',
    GET_CHALLENGE: 'get_challenge',
    START_CHALLENGE: 'start_challenge',
    MAKE_MOVE: 'challenge_move',
    GET_STATE: 'challenge_state',
    GET_ACHIEVEMENTS: 'get_achievements',
    COMPLETE_CHALLENGE: 'complete_challenge',
};
// =============================================================================
// MCP Adapter
// =============================================================================
/**
 * Generates MCP tools and handlers from ChallengeRegistry
 */
export class RegistryMCPAdapter {
    registry;
    sessions = new Map();
    achievementEngines = new Map();
    constructor(registry) {
        this.registry = registry;
        this.initializeAchievementEngines();
    }
    initializeAchievementEngines() {
        for (const challenge of this.registry) {
            const engine = new AchievementEngine();
            engine.register(...challenge.achievements);
            this.achievementEngines.set(challenge.id, engine);
        }
    }
    /**
     * Generate all MCP tool schemas
     */
    generateToolSchemas() {
        return [
            {
                name: REGISTRY_TOOLS.LIST_CHALLENGES,
                description: 'List available challenges with optional filtering',
                inputSchema: {
                    type: 'object',
                    properties: {
                        difficulty: {
                            type: 'integer',
                            description: 'Filter by difficulty (1-5)',
                            enum: [1, 2, 3, 4, 5],
                        },
                        concept: {
                            type: 'string',
                            description: 'Filter by learning concept',
                        },
                        tag: {
                            type: 'string',
                            description: 'Filter by tag',
                        },
                    },
                },
            },
            {
                name: REGISTRY_TOOLS.GET_CHALLENGE,
                description: 'Get detailed information about a specific challenge',
                inputSchema: {
                    type: 'object',
                    properties: {
                        challengeId: {
                            type: 'string',
                            description: 'The challenge ID',
                        },
                    },
                    required: ['challengeId'],
                },
            },
            {
                name: REGISTRY_TOOLS.START_CHALLENGE,
                description: 'Start a new game session for a challenge',
                inputSchema: {
                    type: 'object',
                    properties: {
                        challengeId: {
                            type: 'string',
                            description: 'The challenge to start',
                        },
                        difficulty: {
                            type: 'string',
                            enum: ['easy', 'medium', 'hard'],
                            description: 'AI difficulty (default: medium)',
                        },
                        seed: {
                            type: 'string',
                            description: 'Random seed for deterministic replay',
                        },
                    },
                    required: ['challengeId'],
                },
            },
            {
                name: REGISTRY_TOOLS.MAKE_MOVE,
                description: 'Make a move in an active challenge session',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sessionId: {
                            type: 'string',
                            description: 'The session ID',
                        },
                        move: {
                            type: 'string',
                            description: 'The move to make',
                        },
                    },
                    required: ['sessionId', 'move'],
                },
            },
            {
                name: REGISTRY_TOOLS.GET_STATE,
                description: 'Get current state of a challenge session',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sessionId: {
                            type: 'string',
                            description: 'The session ID',
                        },
                    },
                    required: ['sessionId'],
                },
            },
            {
                name: REGISTRY_TOOLS.GET_ACHIEVEMENTS,
                description: 'Get available achievements for a challenge',
                inputSchema: {
                    type: 'object',
                    properties: {
                        challengeId: {
                            type: 'string',
                            description: 'The challenge ID',
                        },
                    },
                    required: ['challengeId'],
                },
            },
            {
                name: REGISTRY_TOOLS.COMPLETE_CHALLENGE,
                description: 'Complete a challenge session and evaluate achievements',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sessionId: {
                            type: 'string',
                            description: 'The session ID to complete',
                        },
                    },
                    required: ['sessionId'],
                },
            },
        ];
    }
    /**
     * Handle a tool call
     */
    async handleToolCall(name, args) {
        try {
            switch (name) {
                case REGISTRY_TOOLS.LIST_CHALLENGES:
                    return this.listChallenges(args);
                case REGISTRY_TOOLS.GET_CHALLENGE:
                    return this.getChallenge(args);
                case REGISTRY_TOOLS.START_CHALLENGE:
                    return this.startChallenge(args);
                case REGISTRY_TOOLS.MAKE_MOVE:
                    return this.makeMove(args);
                case REGISTRY_TOOLS.GET_STATE:
                    return this.getState(args);
                case REGISTRY_TOOLS.GET_ACHIEVEMENTS:
                    return this.getAchievements(args);
                case REGISTRY_TOOLS.COMPLETE_CHALLENGE:
                    return this.completeChallenge(args);
                default:
                    return { success: false, error: `Unknown tool: ${name}` };
            }
        }
        catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : String(err),
            };
        }
    }
    // ---------------------------------------------------------------------------
    // Tool Implementations
    // ---------------------------------------------------------------------------
    listChallenges(input) {
        const challenges = this.registry.listChallenges({
            difficulty: input.difficulty
                ? { min: input.difficulty, max: input.difficulty }
                : undefined,
            concepts: input.concept ? [input.concept] : undefined,
            tags: input.tag ? [input.tag] : undefined,
        });
        const output = {
            challenges,
            total: challenges.length,
        };
        return { success: true, data: output };
    }
    getChallenge(input) {
        const challenge = this.registry.getChallenge(input.challengeId);
        if (!challenge) {
            return { success: false, error: `Challenge not found: ${input.challengeId}` };
        }
        const output = {
            id: challenge.id,
            name: challenge.meta.name,
            description: challenge.meta.description,
            difficulty: challenge.meta.difficulty,
            concepts: [...challenge.meta.concepts],
            difficulties: [...challenge.difficulties],
            achievementCount: challenge.achievements.length,
            basePoints: challenge.scoring.basePoints,
            achievements: challenge.achievements.map((a) => ({
                id: a.id,
                name: a.name,
                description: a.description,
                rarity: a.rarity,
                points: a.points,
                hidden: a.hidden ?? false,
            })),
        };
        return { success: true, data: output };
    }
    startChallenge(input) {
        const challenge = this.registry.getChallenge(input.challengeId);
        if (!challenge) {
            return { success: false, error: `Challenge not found: ${input.challengeId}` };
        }
        const difficulty = input.difficulty ?? 'medium';
        const seed = (input.seed ?? generateSeed());
        const sessionId = generateSessionId();
        // Start new game
        const engine = challenge.engine;
        const state = engine.newGame(challenge.defaultOptions, seed);
        // Create session
        const session = {
            id: sessionId,
            challengeId: challenge.id,
            engine: engine,
            difficulty,
            seed,
            startedAt: Date.now(),
            state,
            events: [{
                    seq: 0,
                    timestamp: 0,
                    type: 'game_start',
                    payload: {
                        options: challenge.defaultOptions ?? {},
                        seed,
                        initialState: engine.serialize(state),
                    },
                }],
            moveCount: 0,
        };
        this.sessions.set(sessionId, session);
        const legalMoves = engine.getLegalMoves(state);
        const output = {
            sessionId,
            challengeId: challenge.id,
            gameState: engine.renderText(state),
            legalMoves: legalMoves.map((m) => engine.formatMove(m)),
            turn: state.turn,
        };
        return { success: true, data: output };
    }
    makeMove(input) {
        const session = this.sessions.get(input.sessionId);
        if (!session) {
            return { success: false, error: `Session not found: ${input.sessionId}` };
        }
        const { engine, state } = session;
        // Parse move
        const move = engine.parseMove(input.move);
        if (!move) {
            return {
                success: false,
                error: `Invalid move: ${input.move}`,
            };
        }
        // Make move
        const result = engine.makeMove(state, move);
        if (!result.valid) {
            return {
                success: false,
                error: result.error ?? 'Invalid move',
            };
        }
        // Record event
        const timestamp = Date.now() - session.startedAt;
        session.events.push({
            seq: (session.events.length),
            timestamp: timestamp,
            type: 'player_move',
            payload: {
                move,
                moveString: engine.formatMove(move),
                stateBefore: engine.serialize(state),
                stateAfter: engine.serialize(result.state),
            },
        });
        session.state = result.state;
        session.moveCount++;
        // Check if game over
        const gameOver = engine.isGameOver(result.state);
        const gameResult = gameOver ? engine.getResult(result.state) : null;
        // AI response if game not over and it's AI's turn
        let aiMoveStr;
        if (!gameOver && result.state.turn === 'opponent') {
            const aiMove = engine.getAIMove(result.state, session.difficulty, session.seed);
            if (aiMove) {
                const aiResult = engine.makeMove(result.state, aiMove);
                if (aiResult.valid) {
                    aiMoveStr = engine.formatMove(aiMove);
                    // Record AI event
                    session.events.push({
                        seq: (session.events.length),
                        timestamp: (Date.now() - session.startedAt),
                        type: 'ai_move',
                        payload: {
                            move: aiMove,
                            moveString: aiMoveStr,
                            stateBefore: engine.serialize(result.state),
                            stateAfter: engine.serialize(aiResult.state),
                        },
                    });
                    session.state = aiResult.state;
                }
            }
        }
        const finalState = session.state;
        const finalGameOver = engine.isGameOver(finalState);
        const finalResult = finalGameOver ? engine.getResult(finalState) : null;
        const output = {
            valid: true,
            gameState: engine.renderText(finalState),
            legalMoves: engine.getLegalMoves(finalState).map((m) => engine.formatMove(m)),
            turn: finalState.turn,
            gameOver: finalGameOver,
            result: finalResult ?? undefined,
            aiMove: aiMoveStr,
        };
        return { success: true, data: output };
    }
    getState(input) {
        const session = this.sessions.get(input.sessionId);
        if (!session) {
            return { success: false, error: `Session not found: ${input.sessionId}` };
        }
        const { engine, state } = session;
        const output = {
            sessionId: session.id,
            challengeId: session.challengeId,
            gameState: engine.renderText(state),
            legalMoves: engine.getLegalMoves(state).map((m) => engine.formatMove(m)),
            turn: state.turn,
            moveCount: session.moveCount,
            gameOver: engine.isGameOver(state),
        };
        return { success: true, data: output };
    }
    getAchievements(input) {
        const challenge = this.registry.getChallenge(input.challengeId);
        if (!challenge) {
            return { success: false, error: `Challenge not found: ${input.challengeId}` };
        }
        const output = {
            challengeId: challenge.id,
            achievements: challenge.achievements.map((a) => ({
                id: a.id,
                name: a.name,
                description: a.description,
                rarity: a.rarity,
                points: a.points,
                hidden: a.hidden ?? false,
            })),
        };
        return { success: true, data: output };
    }
    completeChallenge(input) {
        const session = this.sessions.get(input.sessionId);
        if (!session) {
            return { success: false, error: `Session not found: ${input.sessionId}` };
        }
        const { engine, state, challengeId, events, seed } = session;
        // Get result
        const result = engine.getResult(state);
        if (!result) {
            return { success: false, error: 'Game is not yet over' };
        }
        // Record game end event
        events.push({
            seq: (events.length),
            timestamp: (Date.now() - session.startedAt),
            type: 'game_end',
            payload: {
                result,
                finalState: engine.serialize(state),
                reason: 'completed',
            },
        });
        // Build replay
        const replayId = generateReplayId();
        const replay = {
            version: '1.0',
            replayId: replayId,
            challengeId: challengeId,
            gameId: session.id,
            seed,
            options: {},
            events,
            result,
            meta: {
                createdAt: session.startedAt,
                completedAt: Date.now(),
                playerMoves: events.filter((e) => e.type === 'player_move').length,
                aiMoves: events.filter((e) => e.type === 'ai_move').length,
                duration: Date.now() - session.startedAt,
            },
        };
        // Evaluate achievements
        const achievementEngine = this.achievementEngines.get(challengeId);
        const evaluation = achievementEngine
            ? achievementEngine.evaluate(result, replay)
            : { earned: [], failed: [], totalPoints: 0, stats: computeGameStats(replay) };
        // Cleanup session
        this.sessions.delete(input.sessionId);
        const output = {
            sessionId: input.sessionId,
            challengeId,
            result,
            evaluation,
            replayId,
        };
        return { success: true, data: output };
    }
    // ---------------------------------------------------------------------------
    // Session Management
    // ---------------------------------------------------------------------------
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    getActiveSessions() {
        return Array.from(this.sessions.keys());
    }
    cleanupExpiredSessions(maxAgeMs = 3600000) {
        const now = Date.now();
        let cleaned = 0;
        for (const [id, session] of this.sessions) {
            if (now - session.startedAt > maxAgeMs) {
                this.sessions.delete(id);
                cleaned++;
            }
        }
        return cleaned;
    }
}
// =============================================================================
// Factory
// =============================================================================
/**
 * Create MCP adapter from registry
 */
export function createRegistryAdapter(registry) {
    return new RegistryMCPAdapter(registry);
}
// =============================================================================
// Utilities
// =============================================================================
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function generateReplayId() {
    return `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function generateSeed() {
    return `seed_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
//# sourceMappingURL=mcp-adapter.js.map