/**
 * MCP Module
 *
 * Type-safe MCP tool generation from ChallengeRegistry.
 */

// Legacy adapter (kept for compatibility)
export {
  RegistryMCPAdapter,
  createRegistryAdapter,
  REGISTRY_TOOLS,
  type RegistryToolName,
  type MCPToolSchema,
  type ToolCallHandler,
  type ToolCallResult,
  type GameSession,
  // Input/Output types
  type ListChallengesInput,
  type ListChallengesOutput,
  type GetChallengeInput,
  type GetChallengeOutput,
  type StartChallengeInput,
  type StartChallengeOutput,
  type ChallengeMoveInput,
  type ChallengeMoveOutput,
  type ChallengeStateInput,
  type ChallengeStateOutput,
  type GetAchievementsInput,
  type GetAchievementsOutput,
  type CompleteChallengeInput,
  type CompleteChallengeOutput,
} from './mcp-adapter';

// New orchestrator (clean architecture)
export {
  MCPOrchestrator,
  createMCPOrchestrator,
  type PipelineContext,
  type StageResult,
} from './mcp-orchestrator';
