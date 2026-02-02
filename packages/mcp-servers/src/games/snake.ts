// Snake MCP Server Implementation
// Simple snake game with look-ahead vision

import { MCPServer, textContent, errorContent } from "../mcp/server";
import type {
  MCPTool,
  SnakeGameState,
  GameState,
  CommandLogEntry,
  ToolCallResult,
} from "../mcp/types";

const GRID_SIZE = 15;

type Direction = "up" | "down" | "left" | "right";
type Cell = "empty" | "food" | "wall" | "body";

interface Position {
  x: number;
  y: number;
}

const snakeTools: MCPTool[] = [
  {
    name: "new_game",
    description: "Start a new snake game",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_state",
    description: "Get full game state (snake position, food, score, direction)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "look",
    description: "Look in all four directions to see what's adjacent to the snake's head (empty, food, wall, body)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "move",
    description: "Move the snake in the specified direction",
    inputSchema: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["up", "down", "left", "right"],
          description: "Direction to move",
        },
      },
      required: ["direction"],
    },
  },
];

function randomPosition(exclude: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (exclude.some((p) => p.x === pos.x && p.y === pos.y));
  return pos;
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function createSnakeServer(
  initialState: GameState | null,
  onStateChange: (state: GameState) => void,
  onCommand: (entry: CommandLogEntry) => void
): MCPServer {
  let gameState: SnakeGameState | null = null;

  // Restore state if available
  if (initialState && initialState.gameType === "snake") {
    gameState = initialState as SnakeGameState;
  }

  const createNewGame = (): SnakeGameState => {
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);
    const snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ];
    const food = randomPosition(snake);

    return {
      gameType: "snake",
      status: "playing",
      createdAt: Date.now(),
      lastActivity: Date.now(),
      snake,
      food,
      direction: "right",
      score: 0,
      gridSize: GRID_SIZE,
      gameOver: false,
    };
  };

  const lookAt = (pos: Position, state: SnakeGameState): Cell => {
    // Check wall
    if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) {
      return "wall";
    }
    // Check food
    if (positionsEqual(pos, state.food)) {
      return "food";
    }
    // Check body (excluding head)
    if (state.snake.slice(1).some((p) => positionsEqual(p, pos))) {
      return "body";
    }
    return "empty";
  };

  const look = (state: SnakeGameState): Record<Direction, Cell> => {
    const head = state.snake[0];
    return {
      up: lookAt({ x: head.x, y: head.y - 1 }, state),
      down: lookAt({ x: head.x, y: head.y + 1 }, state),
      left: lookAt({ x: head.x - 1, y: head.y }, state),
      right: lookAt({ x: head.x + 1, y: head.y }, state),
    };
  };

  const moveSnake = (direction: Direction): { success: boolean; message: string } => {
    if (!gameState || gameState.gameOver) {
      return { success: false, message: "Game not started or already over" };
    }

    // Prevent 180 degree turns
    const opposites: Record<Direction, Direction> = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };
    if (direction === opposites[gameState.direction]) {
      return { success: false, message: "Cannot move in opposite direction" };
    }

    const head = gameState.snake[0];
    let newHead: Position;

    switch (direction) {
      case "up":
        newHead = { x: head.x, y: head.y - 1 };
        break;
      case "down":
        newHead = { x: head.x, y: head.y + 1 };
        break;
      case "left":
        newHead = { x: head.x - 1, y: head.y };
        break;
      case "right":
        newHead = { x: head.x + 1, y: head.y };
        break;
    }

    // Check collision with wall
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      gameState.gameOver = true;
      gameState.status = "finished";
      onStateChange(gameState);
      return { success: false, message: `Game Over! Hit wall. Final score: ${gameState.score}` };
    }

    // Check collision with body
    if (gameState.snake.some((p) => positionsEqual(p, newHead))) {
      gameState.gameOver = true;
      gameState.status = "finished";
      onStateChange(gameState);
      return { success: false, message: `Game Over! Hit body. Final score: ${gameState.score}` };
    }

    // Move snake
    gameState.snake.unshift(newHead);
    gameState.direction = direction;

    // Check food
    if (positionsEqual(newHead, gameState.food)) {
      gameState.score++;
      gameState.food = randomPosition(gameState.snake);
    } else {
      gameState.snake.pop();
    }

    gameState.lastActivity = Date.now();
    onStateChange(gameState);

    return { success: true, message: `Moved ${direction}. Score: ${gameState.score}` };
  };

  const renderBoard = (): string => {
    if (!gameState) return "No game in progress";

    const lines: string[] = [];
    lines.push("+" + "-".repeat(GRID_SIZE * 2 + 1) + "+");

    for (let y = 0; y < GRID_SIZE; y++) {
      let row = "|";
      for (let x = 0; x < GRID_SIZE; x++) {
        const isHead = gameState.snake[0].x === x && gameState.snake[0].y === y;
        const isBody = gameState.snake.slice(1).some((p) => p.x === x && p.y === y);
        const isFood = gameState.food.x === x && gameState.food.y === y;

        if (isHead) {
          row += " O";
        } else if (isBody) {
          row += " o";
        } else if (isFood) {
          row += " *";
        } else {
          row += " .";
        }
      }
      row += " |";
      lines.push(row);
    }

    lines.push("+" + "-".repeat(GRID_SIZE * 2 + 1) + "+");
    return lines.join("\n");
  };

  const handleToolCall = async (
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> => {
    switch (name) {
      case "new_game": {
        gameState = createNewGame();
        onStateChange(gameState);
        const vision = look(gameState);
        return textContent(
          `New game started!\n\n${renderBoard()}\n\n` +
            `Score: 0\n` +
            `Direction: right\n` +
            `Vision: up=${vision.up}, down=${vision.down}, left=${vision.left}, right=${vision.right}\n\n` +
            `Use 'look' to see what's around you, 'move' to move.`
        );
      }

      case "get_state": {
        if (!gameState) {
          return errorContent("No game in progress. Call new_game first.");
        }
        const vision = look(gameState);
        return textContent(
          `${renderBoard()}\n\n` +
            `Score: ${gameState.score}\n` +
            `Direction: ${gameState.direction}\n` +
            `Game Over: ${gameState.gameOver}\n` +
            `Vision: up=${vision.up}, down=${vision.down}, left=${vision.left}, right=${vision.right}`
        );
      }

      case "look": {
        if (!gameState) {
          return errorContent("No game in progress. Call new_game first.");
        }
        const vision = look(gameState);
        return textContent(
          `Looking around from head position (${gameState.snake[0].x}, ${gameState.snake[0].y}):\n` +
            `  up: ${vision.up}\n` +
            `  down: ${vision.down}\n` +
            `  left: ${vision.left}\n` +
            `  right: ${vision.right}\n\n` +
            `Current direction: ${gameState.direction}`
        );
      }

      case "move": {
        if (!gameState) {
          return errorContent("No game in progress. Call new_game first.");
        }
        const direction = args.direction as Direction;
        if (!["up", "down", "left", "right"].includes(direction)) {
          return errorContent("Invalid direction. Use: up, down, left, right");
        }
        const result = moveSnake(direction);
        if (!result.success) {
          return errorContent(result.message);
        }
        const vision = look(gameState);
        return textContent(
          `${result.message}\n\n${renderBoard()}\n\n` +
            `Vision: up=${vision.up}, down=${vision.down}, left=${vision.left}, right=${vision.right}`
        );
      }

      default:
        return errorContent(`Unknown tool: ${name}`);
    }
  };

  return new MCPServer({
    name: "snake-mcp-server",
    version: "0.1.0",
    tools: snakeTools,
    onToolCall: handleToolCall,
    onCommand,
  });
}
