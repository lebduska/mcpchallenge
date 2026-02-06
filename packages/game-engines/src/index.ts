/**
 * Game Engines Package
 *
 * Pure game logic implementations for MCP Challenge
 * All engines implement the GameEngine interface
 */

// Core types
export * from './types';

// Chess engine
export { chessEngine } from './chess';
export type { ChessState, ChessMove, ChessOptions, PlayerColor } from './chess';

// Tic-Tac-Toe engine
export { tictactoeEngine } from './tictactoe';
export type { TicTacToeState, TicTacToeMove, TicTacToeOptions, Symbol, Board } from './tictactoe';

// Snake engine
export { snakeEngine, getVision } from './snake';
export type { SnakeState, SnakeMove, SnakeOptions, Direction, Position, Vision } from './snake';

// Minesweeper engine
export { minesweeperEngine } from './minesweeper';
export type { MinesweeperState, MinesweeperMove, MinesweeperOptions, CellValue } from './minesweeper';

// Canvas engine
export { canvasEngine } from './canvas';
export type { CanvasState, CanvasMove, CanvasOptions, CanvasMoveAction } from './canvas';

// Poly Bridge engine
export { polybridgeEngine } from './polybridge';
export type { PolyBridgeState, PolyBridgeMove, PolyBridgeOptions, Structure, PolyBridgeMoveAction } from './polybridge';
export { LEVELS as POLYBRIDGE_LEVELS, MATERIAL_COSTS } from './polybridge';

// Engine registry for dynamic access
import { chessEngine } from './chess';
import { tictactoeEngine } from './tictactoe';
import { snakeEngine } from './snake';
import { minesweeperEngine } from './minesweeper';
import { canvasEngine } from './canvas';
import { polybridgeEngine } from './polybridge';
import type { GameEngine, GameState } from './types';

export const engines = {
  chess: chessEngine,
  tictactoe: tictactoeEngine,
  snake: snakeEngine,
  canvas: canvasEngine,
  minesweeper: minesweeperEngine,
  polybridge: polybridgeEngine,
} as const;

export type EngineId = keyof typeof engines;

/**
 * Get an engine by ID
 */
export function getEngine(id: string): GameEngine<GameState, unknown> | undefined {
  return engines[id as EngineId] as GameEngine<GameState, unknown> | undefined;
}

/**
 * List all available engine IDs
 */
export function listEngines(): EngineId[] {
  return Object.keys(engines) as EngineId[];
}

/**
 * Get metadata for all engines
 */
export function getAllMetadata() {
  return Object.values(engines).map(e => e.metadata);
}
