-- Seed AI Examples for Tic-Tac-Toe, Chess, Snake

-- =============================================
-- TIC-TAC-TOE EXAMPLES
-- =============================================

-- Random Strategy (Beginner)
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'ttt-random-01',
  'tic-tac-toe',
  'Random Move Strategy',
  'Simple baseline strategy that picks a random legal move. Good for testing but loses to any decent opponent.',
  'random',
  'beginner',
  'typescript',
  '// Random Tic-Tac-Toe Strategy
// Uses @modelcontextprotocol/sdk

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function playRandomTicTacToe() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-tictactoe@latest"],
  });

  const client = new Client({ name: "random-player", version: "1.0" });
  await client.connect(transport);

  // Start a new game
  await client.callTool({ name: "new_game", arguments: { player: "X" } });

  while (true) {
    // Get legal moves
    const movesResult = await client.callTool({ name: "get_legal_moves", arguments: {} });
    const moves = JSON.parse(movesResult.content[0].text);

    if (moves.length === 0) break;

    // Pick random move
    const randomMove = moves[Math.floor(Math.random() * moves.length)];

    // Make the move
    const result = await client.callTool({
      name: "make_move",
      arguments: { position: randomMove }
    });

    const state = JSON.parse(result.content[0].text);
    if (state.status !== "in_progress") {
      console.log(`Game over: ${state.status}`);
      break;
    }
  }

  await client.close();
}

playRandomTicTacToe();',
  NULL,
  NULL,
  1,
  0,
  1739145600,
  1739145600
);

-- Minimax Strategy (Intermediate)
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'ttt-minimax-01',
  'tic-tac-toe',
  'Minimax Algorithm',
  'Unbeatable Tic-Tac-Toe using the Minimax algorithm. Explores all possible game states to find the optimal move.',
  'minimax',
  'intermediate',
  'typescript',
  '// Minimax Tic-Tac-Toe - Unbeatable Strategy
// Uses @modelcontextprotocol/sdk

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type Board = (string | null)[];

function minimax(board: Board, isMaximizing: boolean, player: string): number {
  const opponent = player === "X" ? "O" : "X";
  const winner = checkWinner(board);

  if (winner === player) return 10;
  if (winner === opponent) return -10;
  if (board.every(cell => cell !== null)) return 0;

  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = isMaximizing ? player : opponent;
      scores.push(minimax(board, !isMaximizing, player));
      board[i] = null;
    }
  }

  return isMaximizing ? Math.max(...scores) : Math.min(...scores);
}

function findBestMove(board: Board, player: string): number {
  let bestScore = -Infinity;
  let bestMove = 0;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = player;
      const score = minimax(board, false, player);
      board[i] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

function checkWinner(board: Board): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

async function playMinimaxTicTacToe() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-tictactoe@latest"],
  });

  const client = new Client({ name: "minimax-player", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: { player: "X" } });

  while (true) {
    const boardResult = await client.callTool({ name: "get_board", arguments: {} });
    const state = JSON.parse(boardResult.content[0].text);

    if (state.status !== "in_progress") {
      console.log(`Game over: ${state.status}`);
      break;
    }

    const bestMove = findBestMove(state.board, state.currentPlayer);
    await client.callTool({ name: "make_move", arguments: { position: bestMove } });
  }

  await client.close();
}

playMinimaxTicTacToe();',
  NULL,
  NULL,
  2,
  0,
  1739145600,
  1739145600
);

-- Claude AI Strategy
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'ttt-claude-01',
  'tic-tac-toe',
  'Claude AI Player',
  'Uses Claude API to analyze the board and decide on moves. Shows how to integrate LLM reasoning with MCP tools.',
  'claude',
  'intermediate',
  'typescript',
  '// Claude-powered Tic-Tac-Toe Player
// Uses @modelcontextprotocol/sdk + Anthropic SDK

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function askClaude(board: string[], legalMoves: number[]): Promise<number> {
  const boardDisplay = `
    ${board[0] || "_"} | ${board[1] || "_"} | ${board[2] || "_"}
    ---------
    ${board[3] || "_"} | ${board[4] || "_"} | ${board[5] || "_"}
    ---------
    ${board[6] || "_"} | ${board[7] || "_"} | ${board[8] || "_"}
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `You are playing Tic-Tac-Toe as X. Current board:
${boardDisplay}

Available positions: ${legalMoves.join(", ")}
Positions are numbered 0-8, left to right, top to bottom.

Reply with ONLY the position number for your move. Choose the best move to win or block opponent.`
    }]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const move = parseInt(text.trim());
  return legalMoves.includes(move) ? move : legalMoves[0];
}

async function playClaudeTicTacToe() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-tictactoe@latest"],
  });

  const client = new Client({ name: "claude-player", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: { player: "X" } });

  while (true) {
    const boardResult = await client.callTool({ name: "get_board", arguments: {} });
    const movesResult = await client.callTool({ name: "get_legal_moves", arguments: {} });

    const state = JSON.parse(boardResult.content[0].text);
    const moves = JSON.parse(movesResult.content[0].text);

    if (state.status !== "in_progress" || moves.length === 0) {
      console.log(`Game over: ${state.status}`);
      break;
    }

    const move = await askClaude(state.board, moves);
    await client.callTool({ name: "make_move", arguments: { position: move } });
  }

  await client.close();
}

playClaudeTicTacToe();',
  'claude',
  150,
  3,
  0,
  1739145600,
  1739145600
);

-- =============================================
-- SNAKE EXAMPLES
-- =============================================

-- Greedy Strategy (Beginner)
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'snake-greedy-01',
  'snake',
  'Greedy Chase Strategy',
  'Simple strategy that always moves toward the food. Works well initially but can trap itself as the snake grows.',
  'greedy',
  'beginner',
  'typescript',
  '// Greedy Snake Strategy - Always chase food
// Uses @modelcontextprotocol/sdk

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type Direction = "up" | "down" | "left" | "right";
type Position = { x: number; y: number };

function getDirectionToFood(head: Position, food: Position): Direction {
  const dx = food.x - head.x;
  const dy = food.y - head.y;

  // Prefer horizontal movement if x distance is greater
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "down" : "up";
  }
}

async function playGreedySnake() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-snake@latest"],
  });

  const client = new Client({ name: "greedy-snake", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: {} });

  while (true) {
    const stateResult = await client.callTool({ name: "get_state", arguments: {} });
    const state = JSON.parse(stateResult.content[0].text);

    if (state.gameOver) {
      console.log(`Game over! Score: ${state.score}`);
      break;
    }

    const head = state.snake[0];
    const direction = getDirectionToFood(head, state.food);

    const result = await client.callTool({
      name: "move",
      arguments: { direction }
    });

    const newState = JSON.parse(result.content[0].text);
    if (newState.gameOver) {
      console.log(`Game over! Final score: ${newState.score}`);
      break;
    }
  }

  await client.close();
}

playGreedySnake();',
  NULL,
  NULL,
  1,
  0,
  1739145600,
  1739145600
);

-- A* Pathfinding (Advanced)
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'snake-astar-01',
  'snake',
  'A* Pathfinding Strategy',
  'Advanced strategy using A* pathfinding to find safe routes to food. Considers snake body as obstacles.',
  'a-star',
  'advanced',
  'typescript',
  '// A* Snake Strategy - Optimal pathfinding
// Uses @modelcontextprotocol/sdk

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type Position = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";

interface Node {
  pos: Position;
  g: number; // Cost from start
  h: number; // Heuristic (Manhattan distance to goal)
  f: number; // Total cost
  parent: Node | null;
}

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

function aStar(
  start: Position,
  goal: Position,
  obstacles: Set<string>,
  gridSize: number
): Direction | null {
  const openSet: Node[] = [{ pos: start, g: 0, h: manhattan(start, goal), f: manhattan(start, goal), parent: null }];
  const closedSet = new Set<string>();

  const directions: { dir: Direction; dx: number; dy: number }[] = [
    { dir: "up", dx: 0, dy: -1 },
    { dir: "down", dx: 0, dy: 1 },
    { dir: "left", dx: -1, dy: 0 },
    { dir: "right", dx: 1, dy: 0 },
  ];

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      // Trace back to find first move
      let node = current;
      while (node.parent && node.parent.parent) {
        node = node.parent;
      }
      // Find which direction from start to first step
      for (const { dir, dx, dy } of directions) {
        if (start.x + dx === node.pos.x && start.y + dy === node.pos.y) {
          return dir;
        }
      }
    }

    closedSet.add(posKey(current.pos));

    for (const { dir, dx, dy } of directions) {
      const newPos = { x: current.pos.x + dx, y: current.pos.y + dy };
      const key = posKey(newPos);

      // Check bounds
      if (newPos.x < 0 || newPos.x >= gridSize || newPos.y < 0 || newPos.y >= gridSize) continue;
      // Check obstacles (snake body)
      if (obstacles.has(key)) continue;
      // Check closed set
      if (closedSet.has(key)) continue;

      const g = current.g + 1;
      const h = manhattan(newPos, goal);
      const f = g + h;

      const existing = openSet.find(n => posKey(n.pos) === key);
      if (!existing || g < existing.g) {
        if (existing) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        } else {
          openSet.push({ pos: newPos, g, h, f, parent: current });
        }
      }
    }
  }

  return null; // No path found
}

async function playAStarSnake() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-snake@latest"],
  });

  const client = new Client({ name: "astar-snake", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: {} });

  while (true) {
    const stateResult = await client.callTool({ name: "get_state", arguments: {} });
    const state = JSON.parse(stateResult.content[0].text);

    if (state.gameOver) {
      console.log(`Game over! Score: ${state.score}`);
      break;
    }

    const head = state.snake[0];
    const obstacles = new Set(state.snake.slice(1).map(posKey));

    let direction = aStar(head, state.food, obstacles, state.gridSize);

    // Fallback to any safe direction if no path to food
    if (!direction) {
      const safeDirs = ["up", "down", "left", "right"].filter(dir => {
        const lookup = state.look || {};
        return lookup[dir] !== "wall" && lookup[dir] !== "body";
      });
      direction = safeDirs[0] as Direction || "up";
    }

    await client.callTool({ name: "move", arguments: { direction } });
  }

  await client.close();
}

playAStarSnake();',
  NULL,
  NULL,
  2,
  0,
  1739145600,
  1739145600
);

-- Claude Snake Strategy
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'snake-claude-01',
  'snake',
  'Claude AI Snake',
  'Uses Claude to analyze the game state and decide on moves. Shows vision-based decision making with LLMs.',
  'claude',
  'intermediate',
  'typescript',
  '// Claude-powered Snake Player
// Uses @modelcontextprotocol/sdk + Anthropic SDK

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function askClaude(state: any): Promise<string> {
  const vision = state.look || {};

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 50,
    messages: [{
      role: "user",
      content: `You are playing Snake. Your goal is to eat food and survive.

Current state:
- Score: ${state.score}
- Snake length: ${state.snake.length}
- Vision:
  * UP: ${vision.up || "unknown"}
  * DOWN: ${vision.down || "unknown"}
  * LEFT: ${vision.left || "unknown"}
  * RIGHT: ${vision.right || "unknown"}

Vision values: "empty" (safe), "food" (eat!), "wall" (death), "body" (death)

Reply with exactly one word: up, down, left, or right.
Choose the safest direction that ideally leads to food.`
    }]
  });

  const text = response.content[0].type === "text" ? response.content[0].text.toLowerCase().trim() : "up";
  const valid = ["up", "down", "left", "right"];
  return valid.includes(text) ? text : "up";
}

async function playClaudeSnake() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-snake@latest"],
  });

  const client = new Client({ name: "claude-snake", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: {} });

  while (true) {
    const stateResult = await client.callTool({ name: "get_state", arguments: {} });
    const lookResult = await client.callTool({ name: "look", arguments: {} });

    const state = JSON.parse(stateResult.content[0].text);
    state.look = JSON.parse(lookResult.content[0].text);

    if (state.gameOver) {
      console.log(`Game over! Score: ${state.score}`);
      break;
    }

    const direction = await askClaude(state);
    await client.callTool({ name: "move", arguments: { direction } });

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  await client.close();
}

playClaudeSnake();',
  'claude',
  100,
  3,
  0,
  1739145600,
  1739145600
);

-- =============================================
-- CHESS EXAMPLES
-- =============================================

-- Random Chess (Beginner)
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'chess-random-01',
  'chess',
  'Random Legal Moves',
  'Picks any random legal move. Terrible chess but useful as a baseline opponent for testing.',
  'random',
  'beginner',
  'typescript',
  '// Random Chess Player
// Uses @modelcontextprotocol/sdk

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function playRandomChess() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-chess@latest"],
  });

  const client = new Client({ name: "random-chess", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: { color: "white" } });

  while (true) {
    const movesResult = await client.callTool({ name: "get_legal_moves", arguments: {} });
    const moves = JSON.parse(movesResult.content[0].text);

    if (moves.length === 0) break;

    // Pick random move
    const randomMove = moves[Math.floor(Math.random() * moves.length)];

    const result = await client.callTool({
      name: "make_move",
      arguments: { move: randomMove }
    });

    const state = JSON.parse(result.content[0].text);
    if (state.gameOver) {
      console.log(`Game over: ${state.result}`);
      break;
    }
  }

  await client.close();
}

playRandomChess();',
  NULL,
  NULL,
  1,
  0,
  1739145600,
  1739145600
);

-- Material Evaluation (Intermediate)
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'chess-eval-01',
  'chess',
  'Material Evaluation Strategy',
  'Evaluates moves based on material gain. Captures high-value pieces when possible. Simple but effective.',
  'greedy',
  'intermediate',
  'typescript',
  '// Material-based Chess Strategy
// Uses @modelcontextprotocol/sdk

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Piece values
const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
  P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0,
};

function evaluateMove(move: string, board: string[][]): number {
  // Check if move is a capture (contains ''x'' or lands on occupied square)
  const to = move.slice(-2);
  const file = to.charCodeAt(0) - 97; // a-h -> 0-7
  const rank = 8 - parseInt(to[1]);   // 1-8 -> 7-0

  if (rank >= 0 && rank < 8 && file >= 0 && file < 8) {
    const piece = board[rank][file];
    if (piece && piece !== ".") {
      return PIECE_VALUES[piece] || 0;
    }
  }

  // Prioritize center control for non-captures
  if (["e4", "d4", "e5", "d5"].some(sq => move.includes(sq))) {
    return 0.5;
  }

  return 0;
}

function parseFEN(fen: string): string[][] {
  const board: string[][] = [];
  const rows = fen.split(" ")[0].split("/");

  for (const row of rows) {
    const boardRow: string[] = [];
    for (const char of row) {
      if (isNaN(parseInt(char))) {
        boardRow.push(char);
      } else {
        for (let i = 0; i < parseInt(char); i++) {
          boardRow.push(".");
        }
      }
    }
    board.push(boardRow);
  }

  return board;
}

async function playEvalChess() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-chess@latest"],
  });

  const client = new Client({ name: "eval-chess", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: { color: "white" } });

  while (true) {
    const boardResult = await client.callTool({ name: "get_board", arguments: {} });
    const movesResult = await client.callTool({ name: "get_legal_moves", arguments: {} });

    const state = JSON.parse(boardResult.content[0].text);
    const moves = JSON.parse(movesResult.content[0].text);

    if (moves.length === 0 || state.gameOver) {
      console.log("Game over!");
      break;
    }

    const board = parseFEN(state.fen);

    // Score all moves and pick the best
    const scoredMoves = moves.map((move: string) => ({
      move,
      score: evaluateMove(move, board) + Math.random() * 0.1 // Small random for ties
    }));

    scoredMoves.sort((a: any, b: any) => b.score - a.score);
    const bestMove = scoredMoves[0].move;

    await client.callTool({ name: "make_move", arguments: { move: bestMove } });
  }

  await client.close();
}

playEvalChess();',
  NULL,
  NULL,
  2,
  0,
  1739145600,
  1739145600
);

-- Claude Chess (Advanced)
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'chess-claude-01',
  'chess',
  'Claude Chess Master',
  'Uses Claude to analyze positions and suggest moves. Demonstrates LLM reasoning for complex strategy games.',
  'claude',
  'advanced',
  'typescript',
  '// Claude Chess Player
// Uses @modelcontextprotocol/sdk + Anthropic SDK

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function askClaude(fen: string, moves: string[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `You are a chess engine. Analyze this position and choose the best move.

FEN: ${fen}
Legal moves: ${moves.join(", ")}

Consider:
1. Material balance
2. King safety
3. Piece activity
4. Tactical opportunities (forks, pins, skewers)

Reply with ONLY the move in algebraic notation (e.g., e4, Nf3, O-O, Bxc6).`
    }]
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  // Extract first word that looks like a chess move
  const match = text.match(/[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8][=QRBN]?|O-O-O|O-O/);
  const suggestedMove = match ? match[0] : "";

  return moves.includes(suggestedMove) ? suggestedMove : moves[0];
}

async function playClaudeChess() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-chess@latest"],
  });

  const client = new Client({ name: "claude-chess", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: { color: "white" } });

  let moveCount = 0;
  while (moveCount < 100) { // Limit to 100 moves
    const boardResult = await client.callTool({ name: "get_board", arguments: {} });
    const movesResult = await client.callTool({ name: "get_legal_moves", arguments: {} });

    const state = JSON.parse(boardResult.content[0].text);
    const moves = JSON.parse(movesResult.content[0].text);

    if (moves.length === 0 || state.gameOver) {
      console.log(`Game over: ${state.result || "ended"}`);
      break;
    }

    const move = await askClaude(state.fen, moves);
    console.log(`Move ${++moveCount}: ${move}`);

    await client.callTool({ name: "make_move", arguments: { move } });

    // Avoid rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  await client.close();
}

playClaudeChess();',
  'claude',
  200,
  3,
  0,
  1739145600,
  1739145600
);

-- OpenAI Chess
INSERT INTO ai_examples (id, challenge_id, title, description, strategy, difficulty, language, code, ai_provider, estimated_tokens, sort_order, view_count, created_at, updated_at)
VALUES (
  'chess-openai-01',
  'chess',
  'OpenAI GPT-4 Chess',
  'Uses OpenAI GPT-4 for chess analysis. Alternative to Claude for those using OpenAI API.',
  'openai',
  'advanced',
  'typescript',
  '// OpenAI GPT-4 Chess Player
// Uses @modelcontextprotocol/sdk + OpenAI SDK

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";

const openai = new OpenAI();

async function askGPT(fen: string, moves: string[]): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    max_tokens: 100,
    messages: [{
      role: "system",
      content: "You are a chess engine. Reply with only the best move in algebraic notation."
    }, {
      role: "user",
      content: `Position (FEN): ${fen}\nLegal moves: ${moves.join(", ")}\n\nBest move:`
    }]
  });

  const text = response.choices[0]?.message?.content?.trim() || "";
  const match = text.match(/[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8][=QRBN]?|O-O-O|O-O/);
  const suggestedMove = match ? match[0] : "";

  return moves.includes(suggestedMove) ? suggestedMove : moves[0];
}

async function playOpenAIChess() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-chess@latest"],
  });

  const client = new Client({ name: "openai-chess", version: "1.0" });
  await client.connect(transport);

  await client.callTool({ name: "new_game", arguments: { color: "white" } });

  while (true) {
    const boardResult = await client.callTool({ name: "get_board", arguments: {} });
    const movesResult = await client.callTool({ name: "get_legal_moves", arguments: {} });

    const state = JSON.parse(boardResult.content[0].text);
    const moves = JSON.parse(movesResult.content[0].text);

    if (moves.length === 0 || state.gameOver) break;

    const move = await askGPT(state.fen, moves);
    await client.callTool({ name: "make_move", arguments: { move } });

    await new Promise(r => setTimeout(r, 200));
  }

  await client.close();
}

playOpenAIChess();',
  'openai',
  150,
  4,
  0,
  1739145600,
  1739145600
);
