/**
 * Chess Game Engine
 *
 * Pure game logic implementation using chess.js
 * No I/O, no side effects - just chess rules and AI
 */
import { type GameEngine, type GameState, type Difficulty } from '../types';
export type PlayerColor = 'white' | 'black';
export interface ChessState extends GameState {
    /** FEN string representing the position */
    fen: string;
    /** PGN of the game */
    pgn: string;
    /** Player's color */
    playerColor: PlayerColor;
    /** AI difficulty */
    difficulty: Difficulty;
    /** Last move in SAN */
    lastMove?: string;
    /** Is the current player in check */
    inCheck: boolean;
}
export interface ChessMove {
    /** Move in SAN notation (e.g., "e4", "Nf3", "O-O") */
    san: string;
}
export interface ChessOptions {
    /** Player's color (default: white) */
    color?: PlayerColor | 'random';
    /** AI difficulty (default: medium) */
    difficulty?: Difficulty;
    /** Starting FEN (default: standard position) */
    fen?: string;
}
export declare const chessEngine: GameEngine<ChessState, ChessMove, ChessOptions>;
//# sourceMappingURL=index.d.ts.map