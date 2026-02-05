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

// =============================================================================
// Constants
// =============================================================================

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6],            // Diagonals
] as const;

const EMPTY_BOARD: Board = [null, null, null, null, null, null, null, null, null];

// =============================================================================
// Helper Functions
// =============================================================================

function checkWinner(board: Board): Symbol | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isBoardFull(board: Board): boolean {
  return board.every(cell => cell !== null);
}

function getEmptyPositions(board: Board): number[] {
  return board
    .map((cell, i) => cell === null ? i : -1)
    .filter(i => i !== -1);
}

function minimax(
  board: Board,
  isMaximizing: boolean,
  aiSymbol: Symbol,
  playerSymbol: Symbol,
  depth: number = 0
): number {
  const winner = checkWinner(board);

  if (winner === aiSymbol) return 10 - depth;
  if (winner === playerSymbol) return depth - 10;
  if (isBoardFull(board)) return 0;

  const positions = getEmptyPositions(board);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const pos of positions) {
      const newBoard = [...board] as Board;
      newBoard[pos] = aiSymbol;
      bestScore = Math.max(bestScore, minimax(newBoard, false, aiSymbol, playerSymbol, depth + 1));
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const pos of positions) {
      const newBoard = [...board] as Board;
      newBoard[pos] = playerSymbol;
      bestScore = Math.min(bestScore, minimax(newBoard, true, aiSymbol, playerSymbol, depth + 1));
    }
    return bestScore;
  }
}

function getBestMove(board: Board, aiSymbol: Symbol, playerSymbol: Symbol): number {
  const positions = getEmptyPositions(board);
  let bestScore = -Infinity;
  let bestMove = positions[0];

  for (const pos of positions) {
    const newBoard = [...board] as Board;
    newBoard[pos] = aiSymbol;
    const score = minimax(newBoard, false, aiSymbol, playerSymbol);

    if (score > bestScore) {
      bestScore = score;
      bestMove = pos;
    }
  }

  return bestMove;
}

function getRandomMove(board: Board): number {
  const positions = getEmptyPositions(board);
  return positions[Math.floor(Math.random() * positions.length)];
}

function formatBoard(board: Board): string {
  const display = board.map((cell, i) => cell ?? String(i));
  return [
    ` ${display[0]} │ ${display[1]} │ ${display[2]} `,
    '───┼───┼───',
    ` ${display[3]} │ ${display[4]} │ ${display[5]} `,
    '───┼───┼───',
    ` ${display[6]} │ ${display[7]} │ ${display[8]} `,
  ].join('\n');
}

// =============================================================================
// Tic-Tac-Toe Engine Implementation
// =============================================================================

function createTicTacToeEngine(): GameEngine<TicTacToeState, TicTacToeMove, TicTacToeOptions> {
  return {
    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    metadata: {
      id: 'tictactoe',
      name: 'Tic-Tac-Toe',
      description: 'Classic 3x3 game against minimax AI',
      difficulty: 'easy',
      points: 25,
      transport: 'sse',
      minPlayers: 1,
      maxPlayers: 1,
    },

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------
    newGame(options = {}): TicTacToeState {
      const { symbol = 'X' } = options;

      const playerSymbol: Symbol =
        symbol === 'random'
          ? Math.random() < 0.5 ? 'X' : 'O'
          : symbol;

      return {
        gameId: generateGameId(),
        status: 'playing',
        turn: playerSymbol === 'X' ? 'player' : 'opponent',
        moveCount: 0,
        board: [...EMPTY_BOARD] as Board,
        currentTurn: 'X', // X always goes first
        playerSymbol,
      };
    },

    validateState(state: unknown): state is TicTacToeState {
      if (!state || typeof state !== 'object') return false;
      const s = state as TicTacToeState;
      return (
        typeof s.gameId === 'string' &&
        Array.isArray(s.board) &&
        s.board.length === 9 &&
        ['X', 'O'].includes(s.playerSymbol) &&
        ['X', 'O'].includes(s.currentTurn)
      );
    },

    // -------------------------------------------------------------------------
    // Game Logic
    // -------------------------------------------------------------------------
    getLegalMoves(state: TicTacToeState): TicTacToeMove[] {
      return getEmptyPositions(state.board).map(position => ({ position }));
    },

    isLegalMove(state: TicTacToeState, move: TicTacToeMove): boolean {
      const { position } = move;
      return (
        position >= 0 &&
        position <= 8 &&
        Number.isInteger(position) &&
        state.board[position] === null
      );
    },

    makeMove(state: TicTacToeState, move: TicTacToeMove): MoveResult<TicTacToeState> {
      const { position } = move;

      // Validate position
      if (position < 0 || position > 8 || !Number.isInteger(position)) {
        return {
          state,
          valid: false,
          error: 'Position must be an integer from 0 to 8',
        };
      }

      // Check if position is available
      if (state.board[position] !== null) {
        return {
          state,
          valid: false,
          error: `Position ${position} is already taken`,
        };
      }

      // Check turn
      if (state.currentTurn !== state.playerSymbol && state.turn === 'player') {
        return {
          state,
          valid: false,
          error: "It's not your turn",
        };
      }

      // Make the move
      const newBoard = [...state.board] as Board;
      newBoard[position] = state.currentTurn;

      const nextTurn: Symbol = state.currentTurn === 'X' ? 'O' : 'X';
      const winner = checkWinner(newBoard);
      const isDraw = !winner && isBoardFull(newBoard);

      let status: TicTacToeState['status'] = 'playing';
      if (winner) {
        status = winner === state.playerSymbol ? 'won' : 'lost';
      } else if (isDraw) {
        status = 'draw';
      }

      const newState: TicTacToeState = {
        ...state,
        board: newBoard,
        currentTurn: nextTurn,
        moveCount: state.moveCount + 1,
        lastMoveAt: Date.now(),
        turn: nextTurn === state.playerSymbol ? 'player' : 'opponent',
        status,
        winner: winner ?? (isDraw ? 'draw' : undefined),
      };

      const gameResult = this.isGameOver(newState) ? this.getResult(newState) : undefined;

      return {
        state: newState,
        valid: true,
        result: gameResult ?? undefined,
      };
    },

    getAIMove(state: TicTacToeState, difficulty?: Difficulty): TicTacToeMove | null {
      const positions = getEmptyPositions(state.board);
      if (positions.length === 0) return null;

      const aiSymbol: Symbol = state.playerSymbol === 'X' ? 'O' : 'X';
      const diff = difficulty ?? 'hard'; // TicTacToe default is perfect play

      switch (diff) {
        case 'easy':
          // Random moves
          return { position: getRandomMove(state.board) };

        case 'medium':
          // 50% optimal, 50% random
          if (Math.random() < 0.5) {
            return { position: getRandomMove(state.board) };
          }
          return { position: getBestMove(state.board, aiSymbol, state.playerSymbol) };

        case 'hard':
          // Perfect minimax play
          return { position: getBestMove(state.board, aiSymbol, state.playerSymbol) };
      }
    },

    isGameOver(state: TicTacToeState): boolean {
      return checkWinner(state.board) !== null || isBoardFull(state.board);
    },

    getResult(state: TicTacToeState): GameResult | null {
      const winner = checkWinner(state.board);
      const isDraw = !winner && isBoardFull(state.board);

      if (!winner && !isDraw) return null;

      let status: 'won' | 'lost' | 'draw';
      if (winner) {
        status = winner === state.playerSymbol ? 'won' : 'lost';
      } else {
        status = 'draw';
      }

      return {
        status,
        totalMoves: state.moveCount,
        metadata: {
          winner: winner ?? 'draw',
          playerSymbol: state.playerSymbol,
        },
      };
    },

    // -------------------------------------------------------------------------
    // Serialization
    // -------------------------------------------------------------------------
    serialize(state: TicTacToeState): string {
      return JSON.stringify(state);
    },

    deserialize(data: string): TicTacToeState {
      const parsed = JSON.parse(data);
      if (!this.validateState(parsed)) {
        throw new Error('Invalid tic-tac-toe state data');
      }
      return parsed;
    },

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------
    renderText(state: TicTacToeState): string {
      let text = formatBoard(state.board);
      text += `\n\nYou are: ${state.playerSymbol}`;
      text += `\nTurn: ${state.currentTurn}`;

      if (state.winner) {
        if (state.winner === 'draw') {
          text += '\n\n🤝 Draw!';
        } else if (state.winner === state.playerSymbol) {
          text += '\n\n🎉 You win!';
        } else {
          text += '\n\n💀 You lose!';
        }
      } else {
        const isYourTurn = state.currentTurn === state.playerSymbol;
        text += isYourTurn ? '\n\nYour turn!' : '\n\nOpponent\'s turn...';
      }

      return text;
    },

    renderJSON(state: TicTacToeState): GameStateJSON {
      return {
        gameType: 'tictactoe',
        gameId: state.gameId,
        status: state.status,
        turn: state.turn,
        moveCount: state.moveCount,
        legalMoves: getEmptyPositions(state.board).map(String),
        board: {
          cells: state.board,
          formatted: formatBoard(state.board),
        },
        extra: {
          playerSymbol: state.playerSymbol,
          currentTurn: state.currentTurn,
          winner: state.winner,
        },
      };
    },

    formatMove(move: TicTacToeMove): string {
      return String(move.position);
    },

    parseMove(input: string): TicTacToeMove | null {
      const position = parseInt(input.trim(), 10);
      if (isNaN(position) || position < 0 || position > 8) {
        return null;
      }
      return { position };
    },
  };
}

// =============================================================================
// Export
// =============================================================================

export const tictactoeEngine = createTicTacToeEngine();
