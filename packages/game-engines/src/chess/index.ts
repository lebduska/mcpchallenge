/**
 * Chess Game Engine
 *
 * Pure game logic implementation using chess.js
 * No I/O, no side effects - just chess rules and AI
 */

import { Chess, type Move as ChessJsMove } from 'chess.js';
import {
  generateGameId,
  type GameEngine,
  type GameState,
  type GameResult,
  type MoveResult,
  type GameStateJSON,
  type Difficulty,
} from '../types';

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Chess Engine Implementation
// =============================================================================

function createChessEngine(): GameEngine<ChessState, ChessMove, ChessOptions> {
  return {
    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    metadata: {
      id: 'chess',
      name: 'Chess',
      description: 'Classic chess against Stockfish engine',
      difficulty: 'hard',
      points: 100,
      transport: 'sse',
      minPlayers: 1,
      maxPlayers: 1,
    },

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------
    newGame(options = {}): ChessState {
      const {
        color = 'white',
        difficulty = 'medium',
        fen,
      } = options;

      const playerColor: PlayerColor =
        color === 'random'
          ? Math.random() < 0.5 ? 'white' : 'black'
          : color;

      const chess = fen ? new Chess(fen) : new Chess();

      return {
        gameId: generateGameId(),
        status: 'playing',
        turn: chess.turn() === 'w' ? 'player' : 'opponent',
        moveCount: 0,
        fen: chess.fen(),
        pgn: chess.pgn(),
        playerColor,
        difficulty,
        inCheck: chess.isCheck(),
      };
    },

    validateState(state: unknown): state is ChessState {
      if (!state || typeof state !== 'object') return false;
      const s = state as ChessState;
      return (
        typeof s.gameId === 'string' &&
        typeof s.fen === 'string' &&
        typeof s.playerColor === 'string' &&
        ['white', 'black'].includes(s.playerColor) &&
        ['waiting', 'playing', 'won', 'lost', 'draw'].includes(s.status)
      );
    },

    // -------------------------------------------------------------------------
    // Game Logic
    // -------------------------------------------------------------------------
    getLegalMoves(state: ChessState): ChessMove[] {
      const chess = new Chess(state.fen);
      return chess.moves().map(san => ({ san }));
    },

    isLegalMove(state: ChessState, move: ChessMove): boolean {
      const chess = new Chess(state.fen);
      try {
        const result = chess.move(move.san);
        return result !== null;
      } catch {
        return false;
      }
    },

    makeMove(state: ChessState, move: ChessMove): MoveResult<ChessState> {
      const chess = new Chess(state.fen);

      // Check turn
      const isPlayerTurn = (chess.turn() === 'w') === (state.playerColor === 'white');
      const expectedTurn = state.turn === 'player' ? isPlayerTurn : !isPlayerTurn;

      if (!expectedTurn) {
        return {
          state,
          valid: false,
          error: "It's not your turn",
        };
      }

      try {
        const result = chess.move(move.san);
        if (!result) {
          return {
            state,
            valid: false,
            error: `Invalid move: ${move.san}`,
          };
        }

        const newState: ChessState = {
          ...state,
          fen: chess.fen(),
          pgn: chess.pgn(),
          moveCount: state.moveCount + 1,
          lastMove: result.san,
          lastMoveAt: Date.now(),
          inCheck: chess.isCheck(),
          turn: chess.turn() === 'w'
            ? (state.playerColor === 'white' ? 'player' : 'opponent')
            : (state.playerColor === 'black' ? 'player' : 'opponent'),
          status: this.computeStatus(chess, state.playerColor),
        };

        const gameResult = this.isGameOver(newState) ? this.getResult(newState) : undefined;

        return {
          state: newState,
          valid: true,
          result: gameResult ?? undefined,
        };
      } catch (error) {
        return {
          state,
          valid: false,
          error: `Invalid move: ${move.san}`,
        };
      }
    },

    getAIMove(state: ChessState, difficulty?: Difficulty): ChessMove | null {
      const chess = new Chess(state.fen);
      const moves = chess.moves({ verbose: true });

      if (moves.length === 0) return null;

      const diff = difficulty ?? state.difficulty;

      // AI strategy based on difficulty
      switch (diff) {
        case 'easy':
          // Random moves
          return { san: moves[Math.floor(Math.random() * moves.length)].san };

        case 'medium':
          // Prefer captures and checks
          const goodMoves = moves.filter(
            m => m.captured || m.san.includes('+')
          );
          const pool = goodMoves.length > 0 ? goodMoves : moves;
          return { san: pool[Math.floor(Math.random() * pool.length)].san };

        case 'hard':
          // TODO: Integrate Stockfish WASM for real analysis
          // For now, use medium strategy with some positional awareness
          const scoredMoves = moves.map(m => ({
            move: m,
            score: this.evaluateMove(chess, m),
          }));
          scoredMoves.sort((a, b) => b.score - a.score);

          // Add some randomness to top moves
          const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
          const selected = topMoves[Math.floor(Math.random() * topMoves.length)];
          return { san: selected.move.san };
      }
    },

    isGameOver(state: ChessState): boolean {
      const chess = new Chess(state.fen);
      return chess.isGameOver();
    },

    getResult(state: ChessState): GameResult | null {
      const chess = new Chess(state.fen);

      if (!chess.isGameOver()) return null;

      let status: 'won' | 'lost' | 'draw';

      if (chess.isCheckmate()) {
        // The side to move is checkmated
        const loserIsWhite = chess.turn() === 'w';
        const playerLost = (state.playerColor === 'white') === loserIsWhite;
        status = playerLost ? 'lost' : 'won';
      } else {
        status = 'draw';
      }

      return {
        status,
        totalMoves: state.moveCount,
        metadata: {
          pgn: chess.pgn(),
          reason: chess.isCheckmate()
            ? 'checkmate'
            : chess.isStalemate()
              ? 'stalemate'
              : chess.isThreefoldRepetition()
                ? 'repetition'
                : chess.isInsufficientMaterial()
                  ? 'insufficient_material'
                  : 'fifty_moves',
        },
      };
    },

    // -------------------------------------------------------------------------
    // Serialization
    // -------------------------------------------------------------------------
    serialize(state: ChessState): string {
      return JSON.stringify(state);
    },

    deserialize(data: string): ChessState {
      const parsed = JSON.parse(data);
      if (!this.validateState(parsed)) {
        throw new Error('Invalid chess state data');
      }
      return parsed;
    },

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------
    renderText(state: ChessState): string {
      const chess = new Chess(state.fen);
      let text = '';

      text += `Turn: ${chess.turn() === 'w' ? 'White' : 'Black'}\n`;
      text += `Your color: ${state.playerColor}\n`;
      text += `Moves: ${state.moveCount}\n\n`;
      text += chess.ascii();

      if (state.inCheck && !chess.isGameOver()) {
        text += '\n\n⚠️ CHECK!';
      }

      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          const winner = chess.turn() === 'w' ? 'Black' : 'White';
          text += `\n\n🏁 Checkmate! ${winner} wins.`;
        } else if (chess.isStalemate()) {
          text += '\n\n🤝 Stalemate - Draw';
        } else {
          text += '\n\n🤝 Draw';
        }
      }

      return text;
    },

    renderJSON(state: ChessState): GameStateJSON {
      const chess = new Chess(state.fen);

      return {
        gameType: 'chess',
        gameId: state.gameId,
        status: state.status,
        turn: state.turn,
        moveCount: state.moveCount,
        legalMoves: chess.moves(),
        lastMove: state.lastMove,
        board: {
          fen: state.fen,
          ascii: chess.ascii(),
          pieces: this.getBoardArray(chess),
        },
        extra: {
          playerColor: state.playerColor,
          difficulty: state.difficulty,
          inCheck: state.inCheck,
          pgn: state.pgn,
        },
      };
    },

    formatMove(move: ChessMove): string {
      return move.san;
    },

    parseMove(input: string): ChessMove | null {
      const san = input.trim();
      if (!san) return null;
      return { san };
    },

    // -------------------------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------------------------
    computeStatus(chess: Chess, playerColor: PlayerColor): ChessState['status'] {
      if (!chess.isGameOver()) return 'playing';

      if (chess.isCheckmate()) {
        const loserIsWhite = chess.turn() === 'w';
        const playerLost = (playerColor === 'white') === loserIsWhite;
        return playerLost ? 'lost' : 'won';
      }

      return 'draw';
    },

    evaluateMove(chess: Chess, move: ChessJsMove): number {
      let score = 0;

      // Captures
      if (move.captured) {
        const pieceValues: Record<string, number> = {
          p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
        };
        score += pieceValues[move.captured] * 10;
      }

      // Checks
      if (move.san.includes('+')) score += 5;
      if (move.san.includes('#')) score += 1000;

      // Center control
      const centerSquares = ['d4', 'd5', 'e4', 'e5'];
      if (centerSquares.includes(move.to)) score += 2;

      // Development (early game)
      if (chess.history().length < 10) {
        if (['n', 'b'].includes(move.piece)) score += 1;
        if (move.flags.includes('k') || move.flags.includes('q')) score += 3; // Castling
      }

      return score;
    },

    getBoardArray(chess: Chess): (string | null)[][] {
      const board = chess.board();
      return board.map(row =>
        row.map(square =>
          square ? `${square.color}${square.type}` : null
        )
      );
    },
  } as GameEngine<ChessState, ChessMove, ChessOptions> & {
    computeStatus: (chess: Chess, playerColor: PlayerColor) => ChessState['status'];
    evaluateMove: (chess: Chess, move: ChessJsMove) => number;
    getBoardArray: (chess: Chess) => (string | null)[][];
  };
}

// =============================================================================
// Export
// =============================================================================

export const chessEngine = createChessEngine();
