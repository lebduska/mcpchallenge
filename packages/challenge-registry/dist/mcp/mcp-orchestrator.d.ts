/**
 * MCP Orchestrator
 *
 * Orchestrates service pipeline for MCP tool calls.
 * No business logic - only coordination.
 */
import type { ChallengeRegistry } from '../registry';
import { SessionManager } from '../services/session-manager';
import { ChallengeValidator } from '../services/challenge-validator';
import { AchievementEvaluator } from '../services/achievement-evaluator';
import type { MCPToolSchema, ToolCallResult } from './mcp-adapter';
/**
 * Pipeline context passed through stages
 */
export interface PipelineContext {
    readonly toolName: string;
    readonly args: Record<string, unknown>;
    readonly timestamp: number;
}
/**
 * Pipeline stage result
 */
export type StageResult<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly error: string;
};
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
export declare class MCPOrchestrator {
    private readonly registry;
    private readonly sessionManager;
    private readonly validator;
    private readonly achievementEvaluator;
    private readonly sessionData;
    constructor(registry: ChallengeRegistry);
    /**
     * Generate MCP tool schemas
     */
    generateToolSchemas(): readonly MCPToolSchema[];
    /**
     * Handle MCP tool call
     *
     * This is the ONLY entry point for tool execution.
     * All it does is:
     * 1. Create pipeline context
     * 2. Route to appropriate handler
     * 3. Return result
     */
    handleToolCall(name: string, args: Record<string, unknown>): Promise<ToolCallResult>;
    private handleListChallenges;
    private handleGetChallenge;
    private handleStartChallenge;
    private handleMakeMove;
    private handleGetState;
    private handleGetAchievements;
    private handleCompleteChallenge;
    getSessionManager(): SessionManager;
    getValidator(): ChallengeValidator;
    getAchievementEvaluator(): AchievementEvaluator;
}
export declare function createMCPOrchestrator(registry: ChallengeRegistry): MCPOrchestrator;
//# sourceMappingURL=mcp-orchestrator.d.ts.map