/**
 * Game Engine to MCP Server Adapter
 *
 * Automatically generates MCP tools from a GameEngine interface.
 * Handles state management, tool calls, and response formatting.
 */

import type {
  GameEngine,
  GameState,
  MoveResult,
  Difficulty,
} from '@mcpchallenge/game-engines';
import { MCPServer, textContent, errorContent } from '../mcp/server';
import type {
  MCPTool,
  ToolCallResult,
  CommandLogEntry,
} from '../mcp/types';

// =============================================================================
// Types
// =============================================================================

export interface GameAdapterConfig<TState extends GameState, TMove> {
  /** The game engine to adapt */
  engine: GameEngine<TState, TMove>;

  /** Optional initial state (for resuming games) */
  initialState?: TState | null;

  /** Callback when state changes */
  onStateChange?: (state: TState) => void;

  /** Callback for command logging */
  onCommand?: (entry: CommandLogEntry) => void;

  /** Response format: 'text' for human-readable, 'json' for structured */
  responseFormat?: 'text' | 'json' | 'both';

  /** Whether AI should auto-respond after player moves */
  autoPlayAI?: boolean;
}

export interface AdaptedMCPServer {
  server: MCPServer;
  getState: () => GameState | null;
  setState: (state: GameState) => void;
}

// =============================================================================
// Tool Generators
// =============================================================================

function generateTools<TState extends GameState, TMove>(
  engine: GameEngine<TState, TMove>
): MCPTool[] {
  const { metadata } = engine;

  return [
    {
      name: 'new_game',
      description: `Start a new ${metadata.name} game`,
      inputSchema: {
        type: 'object',
        properties: {
          // Common options
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
            description: 'AI difficulty level (default: medium)',
          },
        },
      },
    },
    {
      name: 'get_state',
      description: 'Get the current game state',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_legal_moves',
      description: 'Get all legal moves in the current position',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'make_move',
      description: `Make a move in the ${metadata.name} game`,
      inputSchema: {
        type: 'object',
        properties: {
          move: {
            type: 'string',
            description: 'The move to make (format depends on game type)',
          },
        },
        required: ['move'],
      },
    },
    {
      name: 'get_ai_move',
      description: 'Get the AI\'s suggested move for the current position',
      inputSchema: {
        type: 'object',
        properties: {
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
            description: 'AI difficulty for this move',
          },
        },
      },
    },
    {
      name: 'resign',
      description: 'Resign the current game',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

// =============================================================================
// Response Formatters
// =============================================================================

function formatTextResponse<TState extends GameState>(
  engine: GameEngine<TState, unknown>,
  state: TState,
  prefix?: string
): string {
  let response = '';
  if (prefix) {
    response += prefix + '\n\n';
  }
  response += engine.renderText(state);
  return response;
}

function formatJSONResponse<TState extends GameState>(
  engine: GameEngine<TState, unknown>,
  state: TState
): string {
  return JSON.stringify(engine.renderJSON(state), null, 2);
}

function formatResponse<TState extends GameState>(
  engine: GameEngine<TState, unknown>,
  state: TState,
  format: 'text' | 'json' | 'both',
  prefix?: string
): ToolCallResult {
  switch (format) {
    case 'text':
      return textContent(formatTextResponse(engine, state, prefix));

    case 'json':
      return {
        content: [
          { type: 'text', text: formatJSONResponse(engine, state) },
        ],
      };

    case 'both':
      return {
        content: [
          { type: 'text', text: formatTextResponse(engine, state, prefix) },
          { type: 'text', text: '\n---\nJSON:\n' + formatJSONResponse(engine, state) },
        ],
      };
  }
}

// =============================================================================
// Main Adapter Function
// =============================================================================

export function createGameAdapter<TState extends GameState, TMove>(
  config: GameAdapterConfig<TState, TMove>
): AdaptedMCPServer {
  const {
    engine,
    initialState = null,
    onStateChange,
    onCommand,
    responseFormat = 'text',
    autoPlayAI = true,
  } = config;

  const { metadata } = engine;

  // Current game state
  let gameState: TState | null = initialState;

  // State management
  const updateState = (state: TState) => {
    gameState = state;
    onStateChange?.(state);
  };

  // Tool call handler
  const handleToolCall = async (
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> => {
    switch (name) {
      // ---------------------------------------------------------------------
      // new_game
      // ---------------------------------------------------------------------
      case 'new_game': {
        const options = { ...args } as Record<string, unknown>;
        const newState = engine.newGame(options);
        updateState(newState);

        let prefix = `New ${metadata.name} game started!`;

        // If it's AI's turn and autoPlayAI is enabled, make AI move
        if (autoPlayAI && newState.turn === 'opponent') {
          const aiMove = engine.getAIMove(newState, options.difficulty as Difficulty);
          if (aiMove) {
            const result = engine.makeMove(newState, aiMove);
            if (result.valid) {
              updateState(result.state);
              prefix += `\nAI plays: ${engine.formatMove(aiMove)}`;
            }
          }
        }

        return formatResponse(engine, gameState!, responseFormat, prefix);
      }

      // ---------------------------------------------------------------------
      // get_state
      // ---------------------------------------------------------------------
      case 'get_state': {
        if (!gameState) {
          return errorContent('No game in progress. Use new_game to start.');
        }
        return formatResponse(engine, gameState, responseFormat);
      }

      // ---------------------------------------------------------------------
      // get_legal_moves
      // ---------------------------------------------------------------------
      case 'get_legal_moves': {
        if (!gameState) {
          return errorContent('No game in progress. Use new_game to start.');
        }

        const moves = engine.getLegalMoves(gameState);
        if (moves.length === 0) {
          return textContent('No legal moves available.');
        }

        const moveStrings = moves.map(m => engine.formatMove(m));
        return textContent(`Legal moves (${moves.length}):\n${moveStrings.join(', ')}`);
      }

      // ---------------------------------------------------------------------
      // make_move
      // ---------------------------------------------------------------------
      case 'make_move': {
        if (!gameState) {
          return errorContent('No game in progress. Use new_game to start.');
        }

        if (engine.isGameOver(gameState)) {
          return errorContent('Game is already over. Start a new game.');
        }

        const moveInput = args.move as string;
        if (!moveInput) {
          return errorContent('Please specify a move.');
        }

        // Parse the move
        const move = engine.parseMove(moveInput);
        if (!move) {
          return errorContent(
            `Invalid move format: "${moveInput}". Use get_legal_moves to see valid moves.`
          );
        }

        // Check if it's player's turn
        if (gameState.turn !== 'player') {
          return errorContent("It's not your turn!");
        }

        // Make the move
        const result = engine.makeMove(gameState, move);
        if (!result.valid) {
          return errorContent(result.error ?? 'Invalid move.');
        }

        updateState(result.state);

        let prefix = `Your move: ${engine.formatMove(move)}`;

        // Check if game is over
        if (result.result) {
          const { status } = result.result;
          if (status === 'won') {
            prefix += '\n\n🎉 You win!';
          } else if (status === 'lost') {
            prefix += '\n\n💀 You lose!';
          } else {
            prefix += '\n\n🤝 Draw!';
          }
          return formatResponse(engine, result.state, responseFormat, prefix);
        }

        // AI response (if enabled and it's AI's turn)
        if (autoPlayAI && result.state.turn === 'opponent') {
          const aiMove = engine.getAIMove(result.state);
          if (aiMove) {
            const aiResult = engine.makeMove(result.state, aiMove);
            if (aiResult.valid) {
              updateState(aiResult.state);
              prefix += `\nAI plays: ${engine.formatMove(aiMove)}`;

              // Check if AI move ended the game
              if (aiResult.result) {
                const { status } = aiResult.result;
                if (status === 'won') {
                  prefix += '\n\n🎉 You win!';
                } else if (status === 'lost') {
                  prefix += '\n\n💀 AI wins!';
                } else {
                  prefix += '\n\n🤝 Draw!';
                }
              }

              return formatResponse(engine, aiResult.state, responseFormat, prefix);
            }
          }
        }

        return formatResponse(engine, gameState!, responseFormat, prefix);
      }

      // ---------------------------------------------------------------------
      // get_ai_move
      // ---------------------------------------------------------------------
      case 'get_ai_move': {
        if (!gameState) {
          return errorContent('No game in progress. Use new_game to start.');
        }

        const difficulty = args.difficulty as Difficulty | undefined;
        const aiMove = engine.getAIMove(gameState, difficulty);

        if (!aiMove) {
          return textContent('No AI move available (game may be over).');
        }

        return textContent(`AI suggests: ${engine.formatMove(aiMove)}`);
      }

      // ---------------------------------------------------------------------
      // resign
      // ---------------------------------------------------------------------
      case 'resign': {
        if (!gameState) {
          return errorContent('No game in progress.');
        }

        if (engine.isGameOver(gameState)) {
          return errorContent('Game is already over.');
        }

        // Mark game as lost
        const finalState: TState = {
          ...gameState,
          status: 'lost',
        };
        updateState(finalState);

        return textContent('You resigned. Game over.');
      }

      // ---------------------------------------------------------------------
      // Unknown tool
      // ---------------------------------------------------------------------
      default:
        return errorContent(`Unknown tool: ${name}`);
    }
  };

  // Create the MCP server
  const server = new MCPServer({
    name: `${metadata.id}-mcp-server`,
    version: '0.2.0',
    tools: generateTools(engine),
    onToolCall: handleToolCall,
    onCommand,
  });

  return {
    server,
    getState: () => gameState,
    setState: (state: GameState) => {
      if (engine.validateState(state)) {
        gameState = state;
      }
    },
  };
}

// =============================================================================
// Convenience Factories
// =============================================================================

/**
 * Create adapted MCP servers for all game engines
 */
export function createAllGameAdapters(
  engines: Record<string, GameEngine<GameState, unknown>>,
  config?: Partial<Omit<GameAdapterConfig<GameState, unknown>, 'engine'>>
): Record<string, AdaptedMCPServer> {
  const adapters: Record<string, AdaptedMCPServer> = {};

  for (const [id, engine] of Object.entries(engines)) {
    adapters[id] = createGameAdapter({
      engine,
      ...config,
    });
  }

  return adapters;
}
