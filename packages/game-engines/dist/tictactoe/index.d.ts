/**
 * Tic-Tac-Toe Game Engine
 *
 * Pure game logic with minimax AI
 * Board positions: 0-8 (top-left to bottom-right)
 *
 *  0 │ 1 │ 2
 * ───┼───┼───
 *  3 │ 4 │ 5
 * ───┼───┼───
 *  6 │ 7 │ 8
 */
import { type GameEngine, type GameState } from '../types';
export type Symbol = 'X' | 'O';
export type Cell = Symbol | null;
export type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];
export interface TicTacToeState extends GameState {
    /** 9-cell board (0-8) */
    board: Board;
    /** Current turn symbol */
    currentTurn: Symbol;
    /** Player's symbol */
    playerSymbol: Symbol;
    /** Winner (if game over) */
    winner?: Symbol | 'draw';
}
export interface TicTacToeMove {
    /** Position 0-8 */
    position: number;
}
export interface TicTacToeOptions {
    /** Player's symbol (default: X, X goes first) */
    symbol?: Symbol | 'random';
}
export declare const tictactoeEngine: GameEngine<TicTacToeState, TicTacToeMove, TicTacToeOptions>;
//# sourceMappingURL=index.d.ts.map