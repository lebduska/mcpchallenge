/**
 * Room Adapter
 *
 * Creates MCP servers for game rooms using the new GameEngine adapters.
 * This replaces the manual server creation in room.ts.
 */

import {
  engines,
  type GameState as EngineGameState,
} from '@mcpchallenge/game-engines';
import { createGameAdapter, type AdaptedMCPServer } from './game-adapter';
import type { MCPServer } from '../mcp/server';
import type { GameState, GameType, CommandLogEntry } from '../mcp/types';

// =============================================================================
// Types
// =============================================================================

export interface RoomMCPServerConfig {
  gameType: GameType;
  initialState: GameState | null;
  onStateChange: (state: GameState) => void;
  onCommand: (entry: CommandLogEntry) => void;
}

// =============================================================================
// Conversion Functions
// =============================================================================

/**
 * Convert old GameState format to new EngineGameState format
 */
function convertToEngineState(
  gameType: GameType,
  oldState: GameState | null
): EngineGameState | null {
  if (!oldState) return null;

  // The new engine states are compatible with the old ones
  // Just need to map some field names
  switch (gameType) {
    case 'chess':
      return {
        gameId: `${oldState.createdAt}`,
        status: oldState.status === 'finished'
          ? ((oldState as any).result === (oldState as any).playerColor ? 'won' : 'lost')
          : 'playing',
        turn: (oldState as any).turn === (oldState as any).playerColor ? 'player' : 'opponent',
        moveCount: 0, // Not tracked in old state
        fen: (oldState as any).fen,
        pgn: (oldState as any).pgn || '',
        playerColor: (oldState as any).playerColor,
        difficulty: (oldState as any).difficulty || 'medium',
        inCheck: false,
      } as any;

    case 'tictactoe':
      return {
        gameId: `${oldState.createdAt}`,
        status: oldState.status === 'finished'
          ? ((oldState as any).winner === (oldState as any).playerSymbol ? 'won' :
             (oldState as any).winner === 'draw' ? 'draw' : 'lost')
          : 'playing',
        turn: (oldState as any).currentTurn === (oldState as any).playerSymbol ? 'player' : 'opponent',
        moveCount: (oldState as any).board.filter((c: any) => c !== null).length,
        board: (oldState as any).board,
        currentTurn: (oldState as any).currentTurn,
        playerSymbol: (oldState as any).playerSymbol,
        winner: (oldState as any).winner,
      } as any;

    case 'snake':
      return {
        gameId: `${oldState.createdAt}`,
        status: (oldState as any).gameOver ? 'lost' : 'playing',
        turn: 'player',
        moveCount: 0,
        score: (oldState as any).score,
        snake: (oldState as any).snake,
        food: (oldState as any).food,
        direction: (oldState as any).direction,
        gridSize: (oldState as any).gridSize,
        gameOver: (oldState as any).gameOver,
      } as any;

    default:
      return null;
  }
}

/**
 * Convert new EngineGameState back to old GameState format
 */
function convertToOldState(
  gameType: GameType,
  engineState: EngineGameState
): GameState {
  const now = Date.now();

  switch (gameType) {
    case 'chess':
      const chessState = engineState as any;
      return {
        gameType: 'chess',
        status: chessState.status === 'playing' ? 'playing' : 'finished',
        createdAt: now,
        lastActivity: now,
        fen: chessState.fen,
        pgn: chessState.pgn,
        turn: chessState.playerColor === 'white'
          ? (chessState.turn === 'player' ? 'white' : 'black')
          : (chessState.turn === 'player' ? 'black' : 'white'),
        playerColor: chessState.playerColor,
        result: chessState.status === 'won'
          ? chessState.playerColor
          : chessState.status === 'lost'
            ? (chessState.playerColor === 'white' ? 'black' : 'white')
            : chessState.status === 'draw' ? 'draw' : undefined,
        difficulty: chessState.difficulty,
      } as GameState;

    case 'tictactoe':
      const tttState = engineState as any;
      return {
        gameType: 'tictactoe',
        status: tttState.status === 'playing' ? 'playing' : 'finished',
        createdAt: now,
        lastActivity: now,
        board: tttState.board,
        currentTurn: tttState.currentTurn,
        playerSymbol: tttState.playerSymbol,
        winner: tttState.winner,
      } as GameState;

    case 'snake':
      const snakeState = engineState as any;
      return {
        gameType: 'snake',
        status: snakeState.gameOver ? 'finished' : 'playing',
        createdAt: now,
        lastActivity: now,
        snake: snakeState.snake,
        food: snakeState.food,
        direction: snakeState.direction,
        score: snakeState.score ?? 0,
        gridSize: snakeState.gridSize,
        gameOver: snakeState.gameOver,
      } as GameState;

    default:
      throw new Error(`Unknown game type: ${gameType}`);
  }
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Create an MCP server for a game room using the new adapter system
 */
export function createRoomMCPServer(config: RoomMCPServerConfig): MCPServer {
  const { gameType, initialState, onStateChange, onCommand } = config;

  // Get the engine
  const engine = engines[gameType as keyof typeof engines];
  if (!engine) {
    throw new Error(`Unknown game type: ${gameType}`);
  }

  // Convert initial state
  const engineInitialState = convertToEngineState(gameType, initialState);

  // Create the adapter
  const adapter = createGameAdapter({
    engine: engine as any,
    initialState: engineInitialState as any,
    onStateChange: (newEngineState) => {
      // Convert back to old format and notify
      const oldState = convertToOldState(gameType, newEngineState);
      onStateChange(oldState);
    },
    onCommand,
    responseFormat: 'text',
    autoPlayAI: true,
  });

  return adapter.server;
}

/**
 * Check if adapter-based server is available for a game type
 */
export function hasAdapterSupport(gameType: GameType): boolean {
  return gameType in engines;
}
