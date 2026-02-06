/**
 * Challenge Registry MCP Adapter
 *
 * Type-safe MCP tool definitions generated from ChallengeRegistry.
 * No chaos - single source of truth.
 */
import type { GameEngine, GameState, GameResult, Difficulty, Seed } from '../types/engine';
import type { ChallengeId } from '../types/challenge';
import type { ReplayEvent } from '../types/replay';
import type { ChallengeRegistry, ChallengeListItem } from '../registry';
import { type AchievementEvaluation } from '../achievements';
export interface MCPToolSchema {
    readonly name: string;
    readonly description: string;
    readonly inputSchema: {
        readonly type: 'object';
        readonly properties: Record<string, PropertySchema>;
        readonly required?: readonly string[];
    };
}
interface PropertySchema {
    readonly type: string;
    readonly description?: string;
    readonly enum?: readonly (string | number)[];
    readonly default?: unknown;
}
export declare const REGISTRY_TOOLS: {
    readonly LIST_CHALLENGES: "list_challenges";
    readonly GET_CHALLENGE: "get_challenge";
    readonly START_CHALLENGE: "start_challenge";
    readonly MAKE_MOVE: "challenge_move";
    readonly GET_STATE: "challenge_state";
    readonly GET_ACHIEVEMENTS: "get_achievements";
    readonly COMPLETE_CHALLENGE: "complete_challenge";
};
export type RegistryToolName = typeof REGISTRY_TOOLS[keyof typeof REGISTRY_TOOLS];
/** list_challenges input */
export interface ListChallengesInput {
    readonly difficulty?: 1 | 2 | 3 | 4 | 5;
    readonly concept?: string;
    readonly tag?: string;
}
/** list_challenges output */
export interface ListChallengesOutput {
    readonly challenges: readonly ChallengeListItem[];
    readonly total: number;
}
/** get_challenge input */
export interface GetChallengeInput {
    readonly challengeId: string;
}
/** get_challenge output */
export interface GetChallengeOutput {
    readonly id: ChallengeId;
    readonly name: string;
    readonly description: string;
    readonly difficulty: number;
    readonly concepts: readonly string[];
    readonly difficulties: readonly Difficulty[];
    readonly achievementCount: number;
    readonly basePoints: number;
    readonly achievements: readonly {
        readonly id: string;
        readonly name: string;
        readonly description: string;
        readonly rarity: string;
        readonly points: number;
        readonly hidden: boolean;
    }[];
}
/** start_challenge input */
export interface StartChallengeInput {
    readonly challengeId: string;
    readonly difficulty?: Difficulty;
    readonly seed?: string;
}
/** start_challenge output */
export interface StartChallengeOutput {
    readonly sessionId: string;
    readonly challengeId: ChallengeId;
    readonly gameState: string;
    readonly legalMoves: readonly string[];
    readonly turn: 'player' | 'opponent';
}
/** challenge_move input */
export interface ChallengeMoveInput {
    readonly sessionId: string;
    readonly move: string;
}
/** challenge_move output */
export interface ChallengeMoveOutput {
    readonly valid: boolean;
    readonly error?: string;
    readonly gameState: string;
    readonly legalMoves: readonly string[];
    readonly turn: 'player' | 'opponent';
    readonly gameOver: boolean;
    readonly result?: {
        readonly status: 'won' | 'lost' | 'draw';
        readonly score?: number;
    };
    readonly aiMove?: string;
}
/** challenge_state input */
export interface ChallengeStateInput {
    readonly sessionId: string;
}
/** challenge_state output */
export interface ChallengeStateOutput {
    readonly sessionId: string;
    readonly challengeId: ChallengeId;
    readonly gameState: string;
    readonly legalMoves: readonly string[];
    readonly turn: 'player' | 'opponent';
    readonly moveCount: number;
    readonly gameOver: boolean;
}
/** get_achievements input */
export interface GetAchievementsInput {
    readonly challengeId: string;
}
/** get_achievements output */
export interface GetAchievementsOutput {
    readonly challengeId: ChallengeId;
    readonly achievements: readonly {
        readonly id: string;
        readonly name: string;
        readonly description: string;
        readonly rarity: string;
        readonly points: number;
        readonly hidden: boolean;
    }[];
}
/** complete_challenge input */
export interface CompleteChallengeInput {
    readonly sessionId: string;
}
/** complete_challenge output */
export interface CompleteChallengeOutput {
    readonly sessionId: string;
    readonly challengeId: ChallengeId;
    readonly result: GameResult;
    readonly evaluation: AchievementEvaluation;
    readonly replayId: string;
}
export type ToolCallHandler = (name: RegistryToolName, args: Record<string, unknown>) => Promise<ToolCallResult>;
import type { DomainEvent } from '../types/domain-events';
export interface ToolCallResult {
    readonly success: boolean;
    readonly data?: unknown;
    readonly error?: string;
    readonly events?: readonly DomainEvent[];
}
export interface GameSession<TState extends GameState = GameState, TMove = unknown> {
    readonly id: string;
    readonly challengeId: ChallengeId;
    readonly engine: GameEngine<TState, TMove, Record<string, unknown>, unknown>;
    readonly difficulty: Difficulty;
    readonly seed: Seed;
    readonly startedAt: number;
    state: TState;
    events: ReplayEvent<TMove>[];
    moveCount: number;
}
/**
 * Generates MCP tools and handlers from ChallengeRegistry
 */
export declare class RegistryMCPAdapter {
    private readonly registry;
    private readonly sessions;
    private readonly achievementEngines;
    constructor(registry: ChallengeRegistry);
    private initializeAchievementEngines;
    /**
     * Generate all MCP tool schemas
     */
    generateToolSchemas(): readonly MCPToolSchema[];
    /**
     * Handle a tool call
     */
    handleToolCall(name: string, args: Record<string, unknown>): Promise<ToolCallResult>;
    private listChallenges;
    private getChallenge;
    private startChallenge;
    private makeMove;
    private getState;
    private getAchievements;
    private completeChallenge;
    getSession(sessionId: string): GameSession | undefined;
    getActiveSessions(): readonly string[];
    cleanupExpiredSessions(maxAgeMs?: number): number;
}
/**
 * Create MCP adapter from registry
 */
export declare function createRegistryAdapter(registry: ChallengeRegistry): RegistryMCPAdapter;
export {};
//# sourceMappingURL=mcp-adapter.d.ts.map