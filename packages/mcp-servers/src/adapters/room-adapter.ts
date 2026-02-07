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
import { systemTools } from '../mcp/system-tools';

// =============================================================================
// Types
// =============================================================================

export interface RoomMCPServerConfig {
  gameType: GameType;
  initialState: GameState | null;
  onStateChange: (state: GameState) => void;
  onCommand: (entry: CommandLogEntry) => void;
  /** Game mode: "ai" for single player vs AI, "pvp" for 2-player MCP vs MCP */
  gameMode?: "ai" | "pvp";
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

    case 'minesweeper':
      const msOldState = oldState as any;
      return {
        gameId: `${oldState.createdAt}`,
        status: msOldState.status,
        turn: 'player',
        moveCount: 0,
        board: msOldState.board,
        revealed: msOldState.revealed,
        flagged: msOldState.flagged,
        rows: msOldState.rows,
        cols: msOldState.cols,
        mineCount: msOldState.mineCount,
        flagsRemaining: msOldState.flagsRemaining,
        startTime: null,
        elapsedSeconds: msOldState.elapsedSeconds || 0,
        firstMove: true,
      } as any;

    case 'canvas':
      const canvasOldState = oldState as any;
      return {
        gameId: `${oldState.createdAt}`,
        status: 'playing',
        turn: 'player',
        moveCount: canvasOldState.commands?.length || 0,
        width: canvasOldState.width || 64,
        height: canvasOldState.height || 64,
        currentColor: [0, 0, 0],
        pixels: [],
        commands: canvasOldState.commands || [],
      } as any;

    case 'sokoban':
      const sokobanOldState = oldState as any;
      return {
        gameId: `${oldState.createdAt}`,
        status: sokobanOldState.status,
        turn: 'player',
        moveCount: sokobanOldState.moveCount || 0,
        board: sokobanOldState.board,
        player: sokobanOldState.player,
        boxes: sokobanOldState.boxes,
        goals: sokobanOldState.goals,
        rows: sokobanOldState.rows,
        cols: sokobanOldState.cols,
        levelIndex: sokobanOldState.levelIndex || 0,
        totalLevels: sokobanOldState.totalLevels || 60,
        pushCount: sokobanOldState.pushCount || 0,
      } as any;

    case 'gorillas':
      const gorillasOldState = oldState as any;
      return {
        gameId: `${oldState.createdAt}`,
        gameType: 'gorillas',
        status: gorillasOldState.status,
        turn: gorillasOldState.currentPlayer === 1 ? 'player' : 'opponent',
        moveCount: gorillasOldState.player1?.score + gorillasOldState.player2?.score || 0,
        buildings: gorillasOldState.buildings,
        player1: gorillasOldState.player1,
        player2: gorillasOldState.player2,
        currentPlayer: gorillasOldState.currentPlayer,
        wind: gorillasOldState.wind,
        gravity: gorillasOldState.gravity,
        levelIndex: gorillasOldState.levelIndex || 0,
        totalLevels: gorillasOldState.totalLevels || 10,
        pointsToWin: gorillasOldState.pointsToWin || 3,
        isVsAI: gorillasOldState.isVsAI ?? true,
        aiDifficulty: gorillasOldState.aiDifficulty || 'medium',
        lastTrajectory: gorillasOldState.lastTrajectory,
        canvasWidth: gorillasOldState.canvasWidth || 800,
        canvasHeight: gorillasOldState.canvasHeight || 400,
      } as any;

    case 'fractals':
      const fractalsOldState = oldState as any;
      return {
        gameId: `${oldState.createdAt}`,
        gameType: 'fractals',
        status: fractalsOldState.status || 'playing',
        turn: 'player',
        moveCount: fractalsOldState.stats?.segmentsDrawn || 0,
        axiom: fractalsOldState.axiom || 'F',
        rules: fractalsOldState.rules || [],
        iterations: fractalsOldState.iterations || 4,
        angle: fractalsOldState.angle || 25,
        length: fractalsOldState.length || 10,
        decay: fractalsOldState.decay || 0.7,
        expandedString: null,
        canvas: {
          width: fractalsOldState.canvasWidth || 512,
          height: fractalsOldState.canvasHeight || 512,
          pixels: [],
        },
        preset: fractalsOldState.preset || null,
        stats: fractalsOldState.stats || { segmentsDrawn: 0, maxDepth: 0 },
        colorScheme: fractalsOldState.colorScheme || 'monochrome',
      } as any;

    case 'lightsout':
      const lightsoutOldState = oldState as any;
      return {
        gameId: `${oldState.createdAt}`,
        gameType: 'lightsout',
        status: lightsoutOldState.status || 'playing',
        turn: 'player',
        moveCount: lightsoutOldState.toggleCount || 0,
        grid: lightsoutOldState.grid || [],
        size: lightsoutOldState.size || 5,
        toggleCount: lightsoutOldState.toggleCount || 0,
        minSolution: lightsoutOldState.minSolution || 5,
        difficulty: lightsoutOldState.difficulty || 'medium',
      } as any;

    default:
      return null;
  }
}

/**
 * Convert new EngineGameState back to old GameState format
 * @param isPvP - Whether this is a PvP game (affects how turn is computed)
 */
function convertToOldState(
  gameType: GameType,
  engineState: EngineGameState,
  isPvP = false
): GameState {
  const now = Date.now();

  switch (gameType) {
    case 'chess':
      const chessState = engineState as any;
      // In PvP mode, we get actual color from FEN (via chess.js turn())
      // In AI mode, we compute from playerColor + turn
      const computedTurn = isPvP
        // PvP: extract turn directly from FEN (w = white, b = black)
        ? (chessState.fen?.split(' ')[1] === 'w' ? 'white' : 'black')
        // AI: compute from playerColor and turn
        : chessState.playerColor === 'white'
          ? (chessState.turn === 'player' ? 'white' : 'black')
          : (chessState.turn === 'player' ? 'black' : 'white');

      return {
        gameType: 'chess',
        status: chessState.status === 'playing' ? 'playing' : 'finished',
        createdAt: now,
        lastActivity: now,
        fen: chessState.fen,
        pgn: chessState.pgn,
        turn: computedTurn,
        playerColor: isPvP ? undefined : chessState.playerColor,
        result: chessState.status === 'won'
          ? chessState.playerColor
          : chessState.status === 'lost'
            ? (chessState.playerColor === 'white' ? 'black' : 'white')
            : chessState.status === 'draw' ? 'draw' : undefined,
        difficulty: chessState.difficulty,
        gameMode: isPvP ? 'pvp' : 'ai',
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

    case 'minesweeper':
      const msState = engineState as any;
      return {
        gameType: 'minesweeper',
        status: msState.status,
        createdAt: now,
        lastActivity: now,
        board: msState.board,
        revealed: msState.revealed,
        flagged: msState.flagged,
        rows: msState.rows,
        cols: msState.cols,
        mineCount: msState.mineCount,
        flagsRemaining: msState.flagsRemaining,
        elapsedSeconds: msState.startTime
          ? Math.floor((Date.now() - msState.startTime) / 1000)
          : 0,
      } as GameState;

    case 'canvas':
      const canvasState = engineState as any;
      return {
        gameType: 'canvas',
        status: 'playing',
        createdAt: now,
        lastActivity: now,
        width: canvasState.width,
        height: canvasState.height,
        commands: canvasState.commands || [],
      } as GameState;

    case 'sokoban':
      const sokobanState = engineState as any;
      return {
        gameType: 'sokoban',
        status: sokobanState.status,
        createdAt: now,
        lastActivity: now,
        board: sokobanState.board,
        player: sokobanState.player,
        boxes: sokobanState.boxes,
        goals: sokobanState.goals,
        rows: sokobanState.rows,
        cols: sokobanState.cols,
        levelIndex: sokobanState.levelIndex,
        totalLevels: sokobanState.totalLevels,
        moveCount: sokobanState.moveCount,
        pushCount: sokobanState.pushCount,
        boxesOnGoals: sokobanState.boxes?.filter((b: any) =>
          sokobanState.goals?.some((g: any) => g.row === b.row && g.col === b.col)
        ).length || 0,
      } as GameState;

    case 'gorillas':
      const gorillasState = engineState as any;
      return {
        gameType: 'gorillas',
        status: gorillasState.status,
        createdAt: now,
        lastActivity: now,
        buildings: gorillasState.buildings,
        player1: gorillasState.player1,
        player2: gorillasState.player2,
        currentPlayer: gorillasState.currentPlayer,
        wind: gorillasState.wind,
        gravity: gorillasState.gravity,
        levelIndex: gorillasState.levelIndex,
        totalLevels: gorillasState.totalLevels,
        pointsToWin: gorillasState.pointsToWin,
        isVsAI: gorillasState.isVsAI,
        aiDifficulty: gorillasState.aiDifficulty,
        lastTrajectory: gorillasState.lastTrajectory,
        canvasWidth: gorillasState.canvasWidth || 800,
        canvasHeight: gorillasState.canvasHeight || 400,
      } as GameState;

    case 'fractals':
      const fractalsState = engineState as any;
      return {
        gameType: 'fractals',
        status: fractalsState.status || 'playing',
        createdAt: now,
        lastActivity: now,
        axiom: fractalsState.axiom,
        rules: fractalsState.rules,
        iterations: fractalsState.iterations,
        angle: fractalsState.angle,
        length: fractalsState.length,
        decay: fractalsState.decay,
        preset: fractalsState.preset,
        colorScheme: fractalsState.colorScheme,
        expandedLength: fractalsState.expandedString?.length || 0,
        stats: fractalsState.stats || { segmentsDrawn: 0, maxDepth: 0 },
        canvasWidth: fractalsState.canvas?.width || 512,
        canvasHeight: fractalsState.canvas?.height || 512,
      } as GameState;

    case 'lightsout':
      const lightsoutState = engineState as any;
      return {
        gameType: 'lightsout',
        status: lightsoutState.status || 'playing',
        createdAt: now,
        lastActivity: now,
        grid: lightsoutState.grid,
        size: lightsoutState.size,
        toggleCount: lightsoutState.toggleCount,
        minSolution: lightsoutState.minSolution,
        difficulty: lightsoutState.difficulty,
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
  const { gameType, initialState, onStateChange, onCommand, gameMode = "ai" } = config;
  const isPvP = gameMode === "pvp";

  // Get the engine
  const engine = engines[gameType as keyof typeof engines];
  if (!engine) {
    throw new Error(`Unknown game type: ${gameType}`);
  }

  // Convert initial state
  const engineInitialState = convertToEngineState(gameType, initialState);

  // Create the adapter with system tools (like agent.identify)
  const adapter = createGameAdapter({
    engine: engine as any,
    initialState: engineInitialState as any,
    onStateChange: (newEngineState) => {
      // Convert back to old format and notify
      const oldState = convertToOldState(gameType, newEngineState, isPvP);
      onStateChange(oldState);
    },
    onCommand,
    responseFormat: 'text',
    // In PvP mode, disable auto AI moves - both players are human/MCP agents
    autoPlayAI: !isPvP,
    // In PvP mode, skip turn validation in adapter - room.ts handles it via validatePvPTurn
    skipTurnValidation: isPvP,
    additionalTools: systemTools,
  });

  return adapter.server;
}

/**
 * Check if adapter-based server is available for a game type
 */
export function hasAdapterSupport(gameType: GameType): boolean {
  return gameType in engines;
}
