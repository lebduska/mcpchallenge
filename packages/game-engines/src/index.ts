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

// Sokoban engine
export { sokobanEngine, SOKOBAN_LEVELS, TOTAL_LEVELS as SOKOBAN_TOTAL_LEVELS } from './sokoban';
export type { SokobanState, SokobanMove, SokobanOptions, Direction as SokobanDirection, Position as SokobanPosition } from './sokoban';

// Gorillas engine
export { GorillasEngine, LEVELS as GORILLAS_LEVELS, simulateThrowPreview, getStrategicHints } from './gorillas';
export type { GorillasState, GorillasMove, GorillasOptions, Position as GorillasPosition, Building, Gorilla, Trajectory, LevelConfig as GorillasLevelConfig } from './gorillas';

// Fractals engine
export { fractalsEngine, FRACTAL_PRESETS } from './fractals';
export type { FractalState, FractalMove, FractalOptions, FractalRule, ColorScheme } from './fractals';

// Lights Out engine
export { lightsOutEngine } from './lightsout';
export type { LightsOutState, LightsOutMove, LightsOutOptions } from './lightsout';

// Pathfinding engine
export { pathfindingEngine, PATHFINDING_LEVELS, TOTAL_LEVELS as PATHFINDING_TOTAL_LEVELS } from './pathfinding';
export type { PathfindingState, PathfindingMove, PathfindingOptions, CellType as PathfindingCellType, Algorithm as PathfindingAlgorithm, PathfindingLevel } from './pathfinding';

// Sorting engine
export { sortingEngine, SORTING_LEVELS, TOTAL_LEVELS as SORTING_TOTAL_LEVELS } from './sorting';
export type { SortingState, SortingMove, SortingOptions, SortingLevel } from './sorting';

// Engine registry for dynamic access
import { chessEngine } from './chess';
import { tictactoeEngine } from './tictactoe';
import { snakeEngine } from './snake';
import { minesweeperEngine } from './minesweeper';
import { canvasEngine } from './canvas';
import { polybridgeEngine } from './polybridge';
import { sokobanEngine } from './sokoban';
import { GorillasEngine } from './gorillas';
import { fractalsEngine } from './fractals';
import { lightsOutEngine } from './lightsout';
import { pathfindingEngine } from './pathfinding';
import { sortingEngine } from './sorting';
import type { GameEngine, GameState } from './types';

export const engines = {
  chess: chessEngine,
  tictactoe: tictactoeEngine,
  snake: snakeEngine,
  canvas: canvasEngine,
  minesweeper: minesweeperEngine,
  polybridge: polybridgeEngine,
  sokoban: sokobanEngine,
  gorillas: GorillasEngine,
  fractals: fractalsEngine,
  lightsout: lightsOutEngine,
  pathfinding: pathfindingEngine,
  sorting: sortingEngine,
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
