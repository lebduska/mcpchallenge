/**
 * Sokoban Game Engine
 *
 * Classic box-pushing puzzle game
 * Push all boxes to goal positions to win
 */
import { type GameEngine, type GameState } from '../types';
export type CellType = 'floor' | 'wall' | 'goal';
export type Direction = 'up' | 'down' | 'left' | 'right';
export interface Position {
    row: number;
    col: number;
}
export interface SokobanState extends GameState {
    /** Static board (floor, walls, goals) */
    board: CellType[][];
    /** Player position */
    player: Position;
    /** Box positions */
    boxes: Position[];
    /** Goal positions */
    goals: Position[];
    /** Board dimensions */
    rows: number;
    cols: number;
    /** Current level index */
    levelIndex: number;
    /** Total levels available */
    totalLevels: number;
    /** Number of pushes (moves that pushed a box) */
    pushCount: number;
}
export interface SokobanMove {
    direction: Direction;
}
export interface SokobanOptions {
    levelIndex?: number;
}
export declare const sokobanEngine: GameEngine<SokobanState, SokobanMove, SokobanOptions>;
export declare const SOKOBAN_LEVELS: ({
    board: CellType[][];
    player: Position;
    boxes: Position[];
    goals: Position[];
    rows: number;
    cols: number;
} | null)[];
export declare const TOTAL_LEVELS: number;
//# sourceMappingURL=index.d.ts.map