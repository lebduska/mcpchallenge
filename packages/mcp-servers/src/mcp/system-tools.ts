// System-level MCP tools that are available in all rooms
// These are handled at the room level, not by game-specific servers

import type { MCPTool } from "./types";

/**
 * agent.identify tool - allows MCP clients to identify themselves
 * Called once immediately after connecting, locked after first call
 */
export const agentIdentifyTool: MCPTool = {
  name: "agent.identify",
  description: "Identify the connected agent. Call once immediately after connecting. Identity is locked after first successful call.",
  inputSchema: {
    type: "object",
    properties: {
      sessionNonce: {
        type: "string",
        description: "Session nonce from connection config (required for verification)",
      },
      name: {
        type: "string",
        description: "Agent name (e.g., 'Claude', 'GPT-4', 'My Custom Agent')",
      },
      model: {
        type: "string",
        description: "Model identifier (e.g., 'claude-3-opus', 'gpt-4-turbo')",
      },
      client: {
        type: "string",
        description: "Client application (e.g., 'Claude Desktop', 'Cursor', 'Custom Script')",
      },
      strategy: {
        type: "string",
        description: "Optional: Brief description of agent's strategy or approach",
      },
      repo: {
        type: "string",
        description: "Optional: Repository URL (must be https://)",
      },
      envVars: {
        type: "array",
        description: "Optional: Environment variable NAMES only (not values) that the agent uses",
      },
      share: {
        type: "string",
        description: "Sharing preference for replays: 'private' (default), 'unlisted', or 'public'",
      },
    },
    required: ["sessionNonce", "name", "model", "client"],
  },
};

/**
 * All system tools that should be added to every room's MCP server
 */
export const systemTools: MCPTool[] = [
  agentIdentifyTool,
];
