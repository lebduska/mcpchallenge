/**
 * Snake Game Engine
 *
 * Classic snake game with look-ahead vision
 * Grid: 15x15 by default, snake starts in center
 */
import { type GameEngine, type GameState } from '../types';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Cell = 'empty' | 'food' | 'wall' | 'body' | 'head';
export interface Position {
    x: number;
    y: number;
}
export interface SnakeState extends GameState {
    /** Snake body positions (head is index 0) */
    snake: Position[];
    /** Food position */
    food: Position;
    /** Current direction */
    direction: Direction;
    /** Grid size (square grid) */
    gridSize: number;
    /** Is game over */
    gameOver: boolean;
}
export interface SnakeMove {
    /** Direction to move */
    direction: Direction;
}
export interface SnakeOptions {
    /** Grid size (default: 15) */
    gridSize?: number;
    /** Initial snake length (default: 3) */
    initialLength?: number;
}
export interface Vision {
    up: Cell;
    down: Cell;
    left: Cell;
    right: Cell;
}
declare function getVision(state: SnakeState): Vision;
export declare const snakeEngine: GameEngine<SnakeState, SnakeMove, SnakeOptions>;
export { getVision };
//# sourceMappingURL=index.d.ts.map