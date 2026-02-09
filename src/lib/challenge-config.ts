/**
 * Challenge Design System Configuration
 *
 * Defines visual language, categories, and shared config for all challenges.
 * Based on expert recommendation: per-category colors with standardized UI elements.
 */

import {
  Grid3X3,
  Crown,
  Gamepad2,
  Banana,
  Box,
  Bomb,
  Lightbulb,
  Palette,
  Route,
  BarChart3,
  TreePine,
  BrickWall,
  type LucideIcon,
} from "lucide-react";

// Challenge categories with their color themes
export type ChallengeCategory = "strategy" | "arcade" | "puzzle" | "educational";

export interface CategoryTheme {
  name: string;
  description: string;
  // Play mode accent color
  playColor: string;
  playColorDark: string;
  // Badge/tag background
  badgeBg: string;
  badgeBgDark: string;
  badgeText: string;
  badgeTextDark: string;
}

export const categoryThemes: Record<ChallengeCategory, CategoryTheme> = {
  strategy: {
    name: "Strategy",
    description: "Think ahead, plan your moves",
    playColor: "text-amber-600",
    playColorDark: "dark:text-amber-400",
    badgeBg: "bg-amber-100",
    badgeBgDark: "dark:bg-amber-900/30",
    badgeText: "text-amber-700",
    badgeTextDark: "dark:text-amber-300",
  },
  arcade: {
    name: "Arcade",
    description: "Fast-paced action games",
    playColor: "text-green-600",
    playColorDark: "dark:text-green-400",
    badgeBg: "bg-green-100",
    badgeBgDark: "dark:bg-green-900/30",
    badgeText: "text-green-700",
    badgeTextDark: "dark:text-green-300",
  },
  puzzle: {
    name: "Puzzle",
    description: "Logic and problem solving",
    playColor: "text-purple-600",
    playColorDark: "dark:text-purple-400",
    badgeBg: "bg-purple-100",
    badgeBgDark: "dark:bg-purple-900/30",
    badgeText: "text-purple-700",
    badgeTextDark: "dark:text-purple-300",
  },
  educational: {
    name: "Educational",
    description: "Learn algorithms and concepts",
    playColor: "text-blue-600",
    playColorDark: "dark:text-blue-400",
    badgeBg: "bg-blue-100",
    badgeBgDark: "dark:bg-blue-900/30",
    badgeText: "text-blue-700",
    badgeTextDark: "dark:text-blue-300",
  },
};

// MCP mode always uses consistent blue theme
export const mcpTheme = {
  color: "text-blue-600",
  colorDark: "dark:text-blue-400",
};

export interface MCPTool {
  name: string;
  params?: string;
  description: string;
}

export interface ChallengeConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: ChallengeCategory;
  icon: LucideIcon;
  iconColor: string; // Tailwind color class
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
  mcpTools: MCPTool[];
  hasPlayMode: boolean; // Some challenges are MCP-only
  coverImage: string;
}

// All challenge configurations
export const challenges: Record<string, ChallengeConfig> = {
  "tic-tac-toe": {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    shortName: "Tic-Tac-Toe",
    description: "Classic 3x3 grid game. Perfect for learning MCP basics.",
    category: "strategy",
    icon: Grid3X3,
    iconColor: "text-amber-500",
    difficulty: 1,
    hasPlayMode: true,
    coverImage: "/images/challenges/tictactoe-cover.jpg",
    mcpTools: [
      { name: "get_board", description: "Get current board state (positions, turn, game status)" },
      { name: "get_legal_moves", description: "Get all available positions (0-8)" },
      { name: "make_move", params: "position", description: "Make a move at position (0-8)" },
      { name: "new_game", params: "player?", description: "Start new game (X/O/random)" },
      { name: "resign", description: "Resign the current game" },
    ],
  },
  chess: {
    id: "chess",
    name: "Chess",
    shortName: "Chess",
    description: "The ultimate strategy game. Build an AI that can checkmate.",
    category: "strategy",
    icon: Crown,
    iconColor: "text-amber-500",
    difficulty: 4,
    hasPlayMode: true,
    coverImage: "/images/challenges/chess-cover.jpg",
    mcpTools: [
      { name: "get_board", description: "Current board state (FEN, turn)" },
      { name: "get_legal_moves", description: "All legal moves" },
      { name: "make_move", params: "move", description: "Make a move (e4, Nf3, O-O)" },
      { name: "new_game", params: "color?", description: "Start new game" },
      { name: "resign", description: "Resign game" },
    ],
  },
  snake: {
    id: "snake",
    name: "Snake",
    shortName: "Snake",
    description: "Control a snake, eat food, grow longer. Don't crash!",
    category: "arcade",
    icon: Gamepad2,
    iconColor: "text-green-500",
    difficulty: 2,
    hasPlayMode: true,
    coverImage: "/images/challenges/snake.jpg",
    mcpTools: [
      { name: "get_state", description: "Get full game state (snake position, food, score, vision)" },
      { name: "look", description: "See what's in each direction (wall, food, body, empty)" },
      { name: "move", params: "direction", description: "Move snake (up/down/left/right)" },
      { name: "new_game", description: "Start a new game" },
    ],
  },
  gorillas: {
    id: "gorillas",
    name: "Gorillas",
    shortName: "Gorillas",
    description: "Classic DOS game. Calculate trajectory to hit your opponent.",
    category: "arcade",
    icon: Banana,
    iconColor: "text-yellow-500",
    difficulty: 3,
    hasPlayMode: true,
    coverImage: "/images/challenges/gorillas-cover.jpg",
    mcpTools: [
      { name: "get_state", description: "Get current game state (buildings, gorillas, wind)" },
      { name: "throw_banana", params: "angle, velocity", description: "Throw banana with angle (0-90) and velocity (10-200)" },
      { name: "get_level", description: "Get current level info and wind conditions" },
      { name: "new_game", params: "level?, difficulty?", description: "Start new game" },
    ],
  },
  sokoban: {
    id: "sokoban",
    name: "Sokoban",
    shortName: "Sokoban",
    description: "Push boxes to their targets. Classic puzzle game.",
    category: "puzzle",
    icon: Box,
    iconColor: "text-purple-500",
    difficulty: 3,
    hasPlayMode: true,
    coverImage: "/images/challenges/sokoban-cover.jpg",
    mcpTools: [
      { name: "get_state", description: "Get current level state (player, boxes, targets, walls)" },
      { name: "move", params: "direction", description: "Move player (up/down/left/right)" },
      { name: "undo", description: "Undo last move" },
      { name: "reset", description: "Reset current level" },
      { name: "load_level", params: "level", description: "Load specific level (1-50)" },
    ],
  },
  minesweeper: {
    id: "minesweeper",
    name: "Minesweeper",
    shortName: "Minesweeper",
    description: "Find all mines without detonating any. Logic puzzle.",
    category: "puzzle",
    icon: Bomb,
    iconColor: "text-purple-500",
    difficulty: 3,
    hasPlayMode: true,
    coverImage: "/images/challenges/minesweeper-cover.jpg",
    mcpTools: [
      { name: "get_board", description: "Get current board state (revealed cells, flags)" },
      { name: "reveal", params: "x, y", description: "Reveal cell at position" },
      { name: "flag", params: "x, y", description: "Toggle flag on cell" },
      { name: "new_game", params: "difficulty?", description: "Start new game (easy/medium/hard)" },
    ],
  },
  lightsout: {
    id: "lightsout",
    name: "Lights Out",
    shortName: "Lights Out",
    description: "Toggle lights to turn them all off. Mathematical puzzle.",
    category: "puzzle",
    icon: Lightbulb,
    iconColor: "text-purple-500",
    difficulty: 2,
    hasPlayMode: true,
    coverImage: "/images/challenges/lightsout-cover.jpg",
    mcpTools: [
      { name: "get_board", description: "Get current light states (on/off grid)" },
      { name: "toggle", params: "x, y", description: "Toggle light at position (affects adjacent)" },
      { name: "new_game", params: "size?", description: "Start new game (3x3 to 7x7)" },
      { name: "check_solved", description: "Check if puzzle is solved" },
    ],
  },
  fractals: {
    id: "fractals",
    name: "Fractals",
    shortName: "Fractals",
    description: "Generate beautiful fractal patterns with recursive algorithms.",
    category: "educational",
    icon: TreePine,
    iconColor: "text-blue-500",
    difficulty: 2,
    hasPlayMode: true,
    coverImage: "/images/challenges/fractals-cover.jpg",
    mcpTools: [
      { name: "set_type", params: "type", description: "Set fractal type (mandelbrot, julia, sierpinski, tree)" },
      { name: "set_params", params: "params", description: "Set generation parameters" },
      { name: "render", description: "Render current fractal" },
      { name: "zoom", params: "x, y, factor", description: "Zoom into specific region" },
    ],
  },
  "canvas-draw": {
    id: "canvas-draw",
    name: "Canvas Draw",
    shortName: "Canvas",
    description: "Draw shapes and patterns using MCP commands.",
    category: "educational",
    icon: Palette,
    iconColor: "text-blue-500",
    difficulty: 1,
    hasPlayMode: true,
    coverImage: "/images/challenges/canvas-cover.jpg",
    mcpTools: [
      { name: "clear", description: "Clear the canvas" },
      { name: "draw_line", params: "x1, y1, x2, y2, color?", description: "Draw a line" },
      { name: "draw_rect", params: "x, y, w, h, color?, fill?", description: "Draw rectangle" },
      { name: "draw_circle", params: "x, y, r, color?, fill?", description: "Draw circle" },
      { name: "set_color", params: "color", description: "Set current drawing color" },
    ],
  },
  pathfinding: {
    id: "pathfinding",
    name: "Pathfinding",
    shortName: "Pathfinding",
    description: "Navigate mazes using pathfinding algorithms.",
    category: "educational",
    icon: Route,
    iconColor: "text-blue-500",
    difficulty: 3,
    hasPlayMode: false,
    coverImage: "/images/challenges/pathfinding-cover.jpg",
    mcpTools: [
      { name: "get_map", description: "Get current map (walls, start, goal)" },
      { name: "get_neighbors", params: "x, y", description: "Get walkable neighbors of cell" },
      { name: "move", params: "direction", description: "Move agent (up/down/left/right)" },
      { name: "load_level", params: "level", description: "Load specific level (1-10)" },
      { name: "check_goal", description: "Check if agent reached goal" },
    ],
  },
  sorting: {
    id: "sorting",
    name: "Sorting Algorithms",
    shortName: "Sorting",
    description: "Learn sorting by implementing compare and swap operations.",
    category: "educational",
    icon: BarChart3,
    iconColor: "text-blue-500",
    difficulty: 2,
    hasPlayMode: false,
    coverImage: "/images/challenges/sorting-cover.jpg",
    mcpTools: [
      { name: "compare", params: "i, j", description: "Compare array[i] with array[j]. Returns -1, 0, or 1" },
      { name: "swap", params: "i, j", description: "Swap elements at positions i and j" },
      { name: "check_sorted", description: "Check if the array is sorted" },
      { name: "load_level", params: "N", description: "Load level N (1-10). Higher = larger arrays" },
    ],
  },
  "poly-bridge": {
    id: "poly-bridge",
    name: "Poly Bridge",
    shortName: "Poly Bridge",
    description: "Build bridges that can support weight. Physics simulation.",
    category: "puzzle",
    icon: BrickWall,
    iconColor: "text-purple-500",
    difficulty: 4,
    hasPlayMode: true,
    coverImage: "/images/challenges/polybridge-cover.jpg",
    mcpTools: [
      { name: "get_level", description: "Get level layout (anchors, gap, budget)" },
      { name: "add_beam", params: "x1, y1, x2, y2, type?", description: "Add beam between points" },
      { name: "remove_beam", params: "id", description: "Remove beam by ID" },
      { name: "simulate", description: "Run physics simulation" },
      { name: "reset", description: "Clear all beams" },
    ],
  },
};

// Helper to get challenge config
export function getChallengeConfig(id: string): ChallengeConfig | undefined {
  return challenges[id];
}

// Helper to get category theme
export function getCategoryTheme(category: ChallengeCategory): CategoryTheme {
  return categoryThemes[category];
}

// Helper to get all challenges by category
export function getChallengesByCategory(category: ChallengeCategory): ChallengeConfig[] {
  return Object.values(challenges).filter((c) => c.category === category);
}

// Get Play tab classes based on category
export function getPlayTabClasses(category: ChallengeCategory): string {
  const theme = categoryThemes[category];
  return `data-[state=active]:${theme.playColor} ${theme.playColorDark}`;
}
