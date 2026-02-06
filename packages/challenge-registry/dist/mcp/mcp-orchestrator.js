/**
 * MCP Orchestrator
 *
 * Orchestrates service pipeline for MCP tool calls.
 * No business logic - only coordination.
 */
// Services
import { createSessionManager, } from '../services/session-manager';
import { ReplayRecorder, } from '../services/replay-recorder';
import { createEngineExecutor, } from '../services/engine-executor';
import { createChallengeValidator, } from '../services/challenge-validator';
import { createAchievementEvaluatorFromRegistry, } from '../services/achievement-evaluator';
import { EventCollector, } from '../services/event-collector';
import { REGISTRY_TOOLS } from './mcp-adapter';
// =============================================================================
// MCP Orchestrator
// =============================================================================
/**
 * MCP Orchestrator
 *
 * Single responsibility: Coordinate services to handle MCP tool calls.
 *
 * Data Flow for make_move:
 * ┌─────────────┐
 * │  MCP Call   │
 * └──────┬──────┘
 *        ▼
 * ┌─────────────────┐
 * │   Validator     │ → Validate input fields
 * └──────┬──────────┘
 *        ▼
 * ┌─────────────────┐
 * │ SessionManager  │ → Get/validate session
 * └──────┬──────────┘
 *        ▼
 * ┌─────────────────┐
 * │ EngineExecutor  │ → Execute move
 * └──────┬──────────┘
 *        ▼
 * ┌─────────────────┐
 * │ ReplayRecorder  │ → Record event
 * └──────┬──────────┘
 *        ▼
 * ┌─────────────────┐
 * │ EngineExecutor  │ → Execute AI (if needed)
 * └──────┬──────────┘
 *        ▼
 * ┌─────────────────┐
 * │ ReplayRecorder  │ → Record AI event
 * └──────┬──────────┘
 *        ▼
 * ┌─────────────────┐
 * │ SessionManager  │ → Update session
 * └──────┬──────────┘
 *        ▼
 * ┌─────────────────┐
 * │    Response     │
 * └─────────────────┘
 */
export class MCPOrchestrator {
    registry;
    // Services
    sessionManager;
    validator;
    achievementEvaluator;
    // Session-specific data (executors, recorders)
    sessionData = new Map();
    constructor(registry) {
        this.registry = registry;
        // Initialize services
        this.sessionManager = createSessionManager({ maxAgeMs: 3600000 });
        this.validator = createChallengeValidator(registry);
        this.achievementEvaluator = createAchievementEvaluatorFromRegistry(Array.from(registry).map((c) => ({
            id: c.id,
            achievements: c.achievements,
        })));
    }
    // ===========================================================================
    // Public API
    // ===========================================================================
    /**
     * Generate MCP tool schemas
     */
    generateToolSchemas() {
        // Delegate to static schema generation
        return generateSchemas();
    }
    /**
     * Handle MCP tool call
     *
     * This is the ONLY entry point for tool execution.
     * All it does is:
     * 1. Create pipeline context
     * 2. Route to appropriate handler
     * 3. Return result
     */
    async handleToolCall(name, args) {
        const ctx = {
            toolName: name,
            args,
            timestamp: Date.now(),
        };
        try {
            switch (name) {
                case REGISTRY_TOOLS.LIST_CHALLENGES:
                    return this.handleListChallenges(ctx);
                case REGISTRY_TOOLS.GET_CHALLENGE:
                    return this.handleGetChallenge(ctx);
                case REGISTRY_TOOLS.START_CHALLENGE:
                    return this.handleStartChallenge(ctx);
                case REGISTRY_TOOLS.MAKE_MOVE:
                    return this.handleMakeMove(ctx);
                case REGISTRY_TOOLS.GET_STATE:
                    return this.handleGetState(ctx);
                case REGISTRY_TOOLS.GET_ACHIEVEMENTS:
                    return this.handleGetAchievements(ctx);
                case REGISTRY_TOOLS.COMPLETE_CHALLENGE:
                    return this.handleCompleteChallenge(ctx);
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
    // ===========================================================================
    // Tool Handlers (Pipeline Orchestration)
    // ===========================================================================
    handleListChallenges(ctx) {
        // Stage 1: Get challenges from registry
        const challenges = this.registry.listChallenges({
            difficulty: ctx.args.difficulty
                ? { min: ctx.args.difficulty, max: ctx.args.difficulty }
                : undefined,
            concepts: ctx.args.concept ? [ctx.args.concept] : undefined,
            tags: ctx.args.tag ? [ctx.args.tag] : undefined,
        });
        // Stage 2: Build response
        const output = {
            challenges,
            total: challenges.length,
        };
        return { success: true, data: output };
    }
    handleGetChallenge(ctx) {
        // Stage 1: Validate input
        const validation = this.validator.validateGetChallenge(ctx.args);
        if (!validation.valid) {
            return { success: false, error: validation.error.message };
        }
        const { challenge } = validation.value;
        // Stage 2: Build response
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
    handleStartChallenge(ctx) {
        // Stage 1: Validate input
        const validation = this.validator.validateStartChallenge(ctx.args);
        if (!validation.valid) {
            return { success: false, error: validation.error.message };
        }
        const { challenge, difficulty, seed: inputSeed } = validation.value;
        const seed = (inputSeed ?? generateSeed());
        // Stage 2: Create executor for this engine
        const executor = createEngineExecutor(challenge.engine);
        // Stage 3: Initialize game
        const initResult = executor.initGame(challenge.defaultOptions, seed);
        // Stage 4: Create replay recorder
        const recorder = new ReplayRecorder();
        recorder.recordStart({
            options: challenge.defaultOptions ?? {},
            seed,
            initialState: initResult.serialized,
        });
        // Stage 5: Create session
        const sessionResult = this.sessionManager.create({
            challengeId: challenge.id,
            difficulty,
            seed,
            initialState: initResult.state,
        });
        if (!sessionResult.ok) {
            return { success: false, error: sessionResult.error.message };
        }
        const session = sessionResult.value;
        // Stage 6: Store session data
        this.sessionData.set(session.id, {
            recorder,
            executor,
            challenge,
        });
        // Stage 7: Create event collector and emit session_created
        const events = new EventCollector(session.id);
        events.emit('session_created', {
            challengeId: challenge.id,
            difficulty,
            seed: seed,
        });
        // Stage 8: Build response
        const output = {
            sessionId: session.id,
            challengeId: challenge.id,
            gameState: executor.renderText(initResult.state),
            legalMoves: initResult.legalMoves,
            turn: initResult.state.turn,
        };
        return { success: true, data: output, events: events.getEvents() };
    }
    handleMakeMove(ctx) {
        // Stage 1: Validate input
        const validation = this.validator.validateMakeMove(ctx.args);
        if (!validation.valid) {
            return { success: false, error: validation.error.message };
        }
        const { sessionId, move } = validation.value;
        // Create event collector for this session
        const events = new EventCollector(sessionId);
        // Stage 2: Get session
        const sessionResult = this.sessionManager.get(sessionId);
        if (!sessionResult.ok) {
            events.emit('error', {
                code: sessionResult.error.code,
                message: sessionResult.error.message,
                recoverable: false,
            });
            return { success: false, error: sessionResult.error.message, events: events.getEvents() };
        }
        const session = sessionResult.value;
        // Stage 3: Validate session state
        const stateValidation = this.validator.validateSessionCanPlay(session);
        if (!stateValidation.valid) {
            events.emit('error', {
                code: stateValidation.error.code,
                message: stateValidation.error.message,
                recoverable: true,
            });
            return { success: false, error: stateValidation.error.message, events: events.getEvents() };
        }
        // Stage 4: Get session data
        const data = this.sessionData.get(sessionId);
        if (!data) {
            events.emit('error', {
                code: 'SESSION_DATA_NOT_FOUND',
                message: 'Session data not found',
                recoverable: false,
            });
            return { success: false, error: 'Session data not found', events: events.getEvents() };
        }
        const { executor, recorder } = data;
        // Stage 5: Execute player move
        const moveResult = executor.executeMove(session.state, move);
        // Emit move_validated event
        events.emit('move_validated', {
            move,
            valid: moveResult.ok,
            error: moveResult.ok ? undefined : moveResult.error.message,
        });
        if (!moveResult.ok) {
            return {
                success: false,
                error: moveResult.error.message,
                events: events.getEvents(),
            };
        }
        // Emit move_executed event
        events.emit('move_executed', {
            move: moveResult.moveString,
            turn: moveResult.state.turn,
            moveCount: session.moveCount + 1,
        });
        // Stage 6: Record player move
        recorder.recordPlayerMove({
            move: moveResult.move,
            moveString: moveResult.moveString,
            stateBefore: moveResult.stateBefore,
            stateAfter: moveResult.stateAfter,
        });
        // Stage 7: Update session state
        let currentState = moveResult.state;
        let aiMoveStr;
        // Stage 8: AI move (if game not over and AI's turn)
        if (!moveResult.gameOver && currentState.turn === 'opponent') {
            // Emit ai_thinking event
            events.emit('ai_thinking', {
                difficulty: session.difficulty,
            });
            const aiResult = executor.executeAI(currentState, session.difficulty, session.seed);
            if (aiResult.hasMove) {
                // Emit ai_moved event
                events.emit('ai_moved', {
                    move: aiResult.moveString,
                    thinkTimeMs: undefined, // Could add timing if needed
                });
                // Stage 9: Record AI move
                recorder.recordAIMove({
                    move: aiResult.move,
                    moveString: aiResult.moveString,
                    stateBefore: aiResult.stateBefore,
                    stateAfter: aiResult.stateAfter,
                });
                currentState = aiResult.state;
                aiMoveStr = aiResult.moveString;
            }
        }
        // Stage 10: Update session
        this.sessionManager.update(sessionId, {
            state: currentState,
            events: recorder.getEvents(),
            moveCount: session.moveCount + 1,
        });
        // Stage 11: Build response
        const stateInfo = executor.getStateInfo(currentState);
        // Emit game_state_changed event
        events.emit('game_state_changed', {
            turn: stateInfo.turn,
            moveCount: session.moveCount + 1,
            gameOver: stateInfo.gameOver,
            legalMoveCount: stateInfo.legalMoves.length,
        });
        const output = {
            valid: true,
            gameState: stateInfo.rendered,
            legalMoves: stateInfo.legalMoves,
            turn: stateInfo.turn,
            gameOver: stateInfo.gameOver,
            result: stateInfo.result ?? undefined,
            aiMove: aiMoveStr,
        };
        return { success: true, data: output, events: events.getEvents() };
    }
    handleGetState(ctx) {
        // Stage 1: Validate input
        const validation = this.validator.validateGetState(ctx.args);
        if (!validation.valid) {
            return { success: false, error: validation.error.message };
        }
        const { sessionId } = validation.value;
        // Stage 2: Get session
        const sessionResult = this.sessionManager.get(sessionId);
        if (!sessionResult.ok) {
            return { success: false, error: sessionResult.error.message };
        }
        const session = sessionResult.value;
        // Stage 3: Get executor
        const data = this.sessionData.get(sessionId);
        if (!data) {
            return { success: false, error: 'Session data not found' };
        }
        // Stage 4: Get state info
        const stateInfo = data.executor.getStateInfo(session.state);
        // Stage 5: Build response
        const output = {
            sessionId,
            challengeId: session.challengeId,
            gameState: stateInfo.rendered,
            legalMoves: stateInfo.legalMoves,
            turn: stateInfo.turn,
            moveCount: session.moveCount,
            gameOver: stateInfo.gameOver,
        };
        return { success: true, data: output };
    }
    handleGetAchievements(ctx) {
        // Stage 1: Validate input
        const validation = this.validator.validateGetChallenge(ctx.args);
        if (!validation.valid) {
            return { success: false, error: validation.error.message };
        }
        const { challenge } = validation.value;
        // Stage 2: Get achievements
        const achievements = this.achievementEvaluator.getVisibleAchievements(challenge.id);
        // Stage 3: Build response
        const output = {
            challengeId: challenge.id,
            achievements: achievements.map((a) => ({
                id: a.id,
                name: a.name,
                description: a.description,
                rarity: a.rarity,
                points: a.points,
                hidden: false,
            })),
        };
        return { success: true, data: output };
    }
    handleCompleteChallenge(ctx) {
        // Stage 1: Validate input
        const validation = this.validator.validateCompleteChallenge(ctx.args);
        if (!validation.valid) {
            return { success: false, error: validation.error.message };
        }
        const { sessionId } = validation.value;
        // Create event collector
        const events = new EventCollector(sessionId);
        // Stage 2: Get session
        const sessionResult = this.sessionManager.get(sessionId);
        if (!sessionResult.ok) {
            events.emit('error', {
                code: sessionResult.error.code,
                message: sessionResult.error.message,
                recoverable: false,
            });
            return { success: false, error: sessionResult.error.message, events: events.getEvents() };
        }
        const session = sessionResult.value;
        // Stage 3: Get session data
        const data = this.sessionData.get(sessionId);
        if (!data) {
            events.emit('error', {
                code: 'SESSION_DATA_NOT_FOUND',
                message: 'Session data not found',
                recoverable: false,
            });
            return { success: false, error: 'Session data not found', events: events.getEvents() };
        }
        const { executor, recorder, challenge } = data;
        // Stage 4: Get result
        const result = executor.getResult(session.state);
        if (!result) {
            events.emit('error', {
                code: 'GAME_NOT_OVER',
                message: 'Game is not over yet',
                recoverable: true,
            });
            return { success: false, error: 'Game is not over yet', events: events.getEvents() };
        }
        // Stage 5: Record game end
        recorder.recordEnd({
            result,
            finalState: executor.serialize(session.state),
            reason: 'completed',
        });
        // Stage 6: Build replay
        const replay = recorder.build({
            challengeId: challenge.id,
            gameId: sessionId,
            seed: session.seed,
            options: challenge.defaultOptions ?? {},
            result,
        });
        // Stage 7: Evaluate achievements
        const evaluation = this.achievementEvaluator.evaluate({
            challengeId: challenge.id,
            result,
            replay,
        });
        // Emit game_completed event
        events.emit('game_completed', {
            result,
            replayId: replay.replayId,
        });
        // Emit achievement_earned events for each earned achievement
        for (const earned of evaluation.earned) {
            events.emit('achievement_earned', {
                achievementId: earned.id,
                name: earned.name,
                description: earned.description,
                points: earned.points,
                rarity: earned.rarity,
                icon: undefined,
            });
        }
        // Emit achievement_evaluation_complete event
        events.emit('achievement_evaluation_complete', {
            totalEarned: evaluation.earned.length,
            totalPoints: evaluation.totalPoints,
        });
        // Stage 8: Complete session
        this.sessionManager.complete(sessionId);
        // Stage 9: Cleanup session data
        this.sessionData.delete(sessionId);
        // Stage 10: Build response
        const output = {
            sessionId,
            challengeId: challenge.id,
            result,
            evaluation: {
                earned: evaluation.earned,
                failed: [],
                totalPoints: evaluation.totalPoints,
                stats: evaluation.stats,
            },
            replayId: replay.replayId,
        };
        return { success: true, data: output, events: events.getEvents() };
    }
    // ===========================================================================
    // Service Access (for testing/extension)
    // ===========================================================================
    getSessionManager() {
        return this.sessionManager;
    }
    getValidator() {
        return this.validator;
    }
    getAchievementEvaluator() {
        return this.achievementEvaluator;
    }
}
// =============================================================================
// Schema Generation (Pure Function)
// =============================================================================
function generateSchemas() {
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
// =============================================================================
// Factory
// =============================================================================
export function createMCPOrchestrator(registry) {
    return new MCPOrchestrator(registry);
}
// =============================================================================
// Utilities
// =============================================================================
function generateSeed() {
    return `seed_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
//# sourceMappingURL=mcp-orchestrator.js.map