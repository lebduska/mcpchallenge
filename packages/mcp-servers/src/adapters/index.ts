/**
 * MCP Adapters
 *
 * Utilities for converting game engines to MCP servers
 */

export {
  createGameAdapter,
  createAllGameAdapters,
  type GameAdapterConfig,
  type AdaptedMCPServer,
} from './game-adapter';

export {
  createRoomMCPServer,
  hasAdapterSupport,
  type RoomMCPServerConfig,
} from './room-adapter';
