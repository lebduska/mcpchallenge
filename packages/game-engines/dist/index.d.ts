/**
 * Game Engines Package
 *
 * Pure game logic implementations for MCP Challenge
 * All engines implement the GameEngine interface
 */
export * from './types';
export { chessEngine } from './chess';
export type { ChessState, ChessMove, ChessOptions, PlayerColor } from './chess';
export { tictactoeEngine } from './tictactoe';
export type { TicTacToeState, TicTacToeMove, TicTacToeOptions, Symbol, Board } from './tictactoe';
export { snakeEngine, getVision } from './snake';
export type { SnakeState, SnakeMove, SnakeOptions, Direction, Position, Vision } from './snake';
export { minesweeperEngine } from './minesweeper';
export type { MinesweeperState, MinesweeperMove, MinesweeperOptions, CellValue } from './minesweeper';
export { canvasEngine } from './canvas';
export type { CanvasState, CanvasMove, CanvasOptions, CanvasMoveAction } from './canvas';
export { polybridgeEngine } from './polybridge';
export type { PolyBridgeState, PolyBridgeMove, PolyBridgeOptions, Structure, PolyBridgeMoveAction } from './polybridge';
export { LEVELS as POLYBRIDGE_LEVELS, MATERIAL_COSTS } from './polybridge';
export { sokobanEngine, SOKOBAN_LEVELS, TOTAL_LEVELS as SOKOBAN_TOTAL_LEVELS } from './sokoban';
export type { SokobanState, SokobanMove, SokobanOptions, Direction as SokobanDirection, Position as SokobanPosition } from './sokoban';
import type { GameEngine, GameState } from './types';
export declare const engines: {
    readonly chess: GameEngine<import("./chess").ChessState, import("./chess").ChessMove, import("./chess").ChessOptions>;
    readonly tictactoe: GameEngine<import("./tictactoe").TicTacToeState, import("./tictactoe").TicTacToeMove, import("./tictactoe").TicTacToeOptions>;
    readonly snake: GameEngine<import("./snake").SnakeState, import("./snake").SnakeMove, import("./snake").SnakeOptions>;
    readonly canvas: GameEngine<import("./canvas").CanvasState, import("./canvas").CanvasMove, import("./canvas").CanvasOptions>;
    readonly minesweeper: GameEngine<import("./minesweeper").MinesweeperState, import("./minesweeper").MinesweeperMove, import("./minesweeper").MinesweeperOptions>;
    readonly polybridge: GameEngine<import("./polybridge").PolyBridgeState, import("./polybridge").PolyBridgeMove, import("./polybridge").PolyBridgeOptions>;
    readonly sokoban: GameEngine<import("./sokoban").SokobanState, import("./sokoban").SokobanMove, import("./sokoban").SokobanOptions>;
};
export type EngineId = keyof typeof engines;
/**
 * Get an engine by ID
 */
export declare function getEngine(id: string): GameEngine<GameState, unknown> | undefined;
/**
 * List all available engine IDs
 */
export declare function listEngines(): EngineId[];
/**
 * Get metadata for all engines
 */
export declare function getAllMetadata(): import("./types").GameEngineMetadata[];
//# sourceMappingURL=index.d.ts.map