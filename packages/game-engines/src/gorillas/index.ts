/**
 * Gorillas Game Engine
 *
 * Classic artillery game inspired by GORILLA.BAS (MS-DOS 1991)
 * Two gorillas throw explosive bananas at each other across a cityscape
 *
 * Physics: Projectile motion with gravity and wind
 * Players input: angle (0-360°) and velocity (1-200)
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

export interface Position {
  x: number;
  y: number;
}

export interface Building {
  x: number;
  width: number;
  height: number;
  /** Damage mask - array of damaged pixel columns (relative heights) */
  damage: number[];
}

export interface Gorilla {
  position: Position;
  buildingIndex: number;
  score: number;
  name: string;
}

export interface Trajectory {
  points: Position[];
  hit: 'building' | 'gorilla' | 'out-of-bounds' | 'sun' | null;
  hitPosition?: Position;
  explosionRadius: number;
}

export interface GorillasState extends GameState {
  /** Game type identifier */
  gameType: 'gorillas';
  /** City buildings */
  buildings: Building[];
  /** Player 1 (left gorilla) */
  player1: Gorilla;
  /** Player 2 (right gorilla) - can be AI or human */
  player2: Gorilla;
  /** Current wind strength (-15 to +15, negative = left) */
  wind: number;
  /** Gravity constant (default 9.8) */
  gravity: number;
  /** Current level index */
  levelIndex: number;
  /** Total levels */
  totalLevels: number;
  /** Points needed to win */
  pointsToWin: number;
  /** Canvas dimensions */
  width: number;
  height: number;
  /** Sun position */
  sunPosition: Position;
  /** Is player 2 AI? */
  isVsAI: boolean;
  /** AI difficulty */
  aiDifficulty: Difficulty;
  /** Last throw trajectory (for visualization) */
  lastTrajectory?: Trajectory;
  /** Which player just threw */
  lastThrower?: 'player1' | 'player2';
  /** Message to display */
  message?: string;
}

export interface GorillasMove {
  angle: number;    // 0-360 degrees
  velocity: number; // 1-200 units
}

export interface GorillasOptions {
  levelIndex?: number;
  vsAI?: boolean;
  aiDifficulty?: Difficulty;
  player1Name?: string;
  player2Name?: string;
  pointsToWin?: number;
  gravity?: number;
}

// =============================================================================
// Level Configuration
// =============================================================================

interface LevelConfig {
  name: string;
  buildingCount: number;
  minHeight: number;
  maxHeight: number;
  windRange: [number, number];
  gravity: number;
  description: string;
}

const LEVELS: LevelConfig[] = [
  {
    name: "Tutorial",
    buildingCount: 8,
    minHeight: 100,
    maxHeight: 200,
    windRange: [0, 0], // No wind
    gravity: 9.8,
    description: "No wind - learn the basics",
  },
  {
    name: "Light Breeze",
    buildingCount: 10,
    minHeight: 100,
    maxHeight: 250,
    windRange: [-3, 3],
    gravity: 9.8,
    description: "Light wind conditions",
  },
  {
    name: "City Center",
    buildingCount: 12,
    minHeight: 150,
    maxHeight: 300,
    windRange: [-5, 5],
    gravity: 9.8,
    description: "Taller buildings, moderate wind",
  },
  {
    name: "Windy Day",
    buildingCount: 10,
    minHeight: 100,
    maxHeight: 250,
    windRange: [-8, 8],
    gravity: 9.8,
    description: "Strong wind gusts",
  },
  {
    name: "Skyscraper District",
    buildingCount: 14,
    minHeight: 200,
    maxHeight: 350,
    windRange: [-6, 6],
    gravity: 9.8,
    description: "Very tall buildings",
  },
  {
    name: "Storm Front",
    buildingCount: 12,
    minHeight: 150,
    maxHeight: 280,
    windRange: [-12, 12],
    gravity: 9.8,
    description: "Extreme wind conditions",
  },
  {
    name: "Low Gravity",
    buildingCount: 10,
    minHeight: 100,
    maxHeight: 200,
    windRange: [-4, 4],
    gravity: 4.0,
    description: "Moon-like gravity",
  },
  {
    name: "High Gravity",
    buildingCount: 10,
    minHeight: 80,
    maxHeight: 180,
    windRange: [-4, 4],
    gravity: 15.0,
    description: "Jupiter-like gravity",
  },
  {
    name: "Urban Canyon",
    buildingCount: 16,
    minHeight: 180,
    maxHeight: 320,
    windRange: [-10, 10],
    gravity: 9.8,
    description: "Dense cityscape with varying wind",
  },
  {
    name: "Final Challenge",
    buildingCount: 14,
    minHeight: 200,
    maxHeight: 380,
    windRange: [-15, 15],
    gravity: 9.8,
    description: "Maximum difficulty!",
  },
];

// =============================================================================
// Constants
// =============================================================================

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GORILLA_SIZE = 30;
const BANANA_RADIUS = 5;
const EXPLOSION_RADIUS = 25;
const SUN_RADIUS = 30;
const BUILDING_MIN_WIDTH = 40;
const BUILDING_MAX_WIDTH = 70;
const TIME_STEP = 0.05; // Physics simulation time step

// =============================================================================
// Helper Functions
// =============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function generateBuildings(level: LevelConfig): Building[] {
  const buildings: Building[] = [];
  let x = 0;
  const gapBetween = 2;

  // Generate buildings until they fill the entire canvas width
  // buildingCount from level is now a minimum, not a maximum
  while (x < CANVAS_WIDTH - BUILDING_MIN_WIDTH) {
    const remainingWidth = CANVAS_WIDTH - x;
    // Make sure last building fits
    const maxW = Math.min(BUILDING_MAX_WIDTH, remainingWidth - gapBetween);
    const minW = Math.min(BUILDING_MIN_WIDTH, maxW);

    if (minW < 20) break; // Don't create too narrow buildings

    const width = randomInt(minW, maxW);
    const height = randomInt(level.minHeight, level.maxHeight);

    buildings.push({
      x,
      width,
      height,
      damage: new Array(width).fill(0), // No damage initially
    });

    x += width + gapBetween;
  }

  return buildings;
}

function generateWind(range: [number, number]): number {
  return randomFloat(range[0], range[1]);
}

function placeGorilla(buildings: Building[], isLeft: boolean, canvasHeight: number): { position: Position; buildingIndex: number } {
  // Pick a building on the left or right side
  const buildingCount = buildings.length;
  const buildingIndex = isLeft
    ? randomInt(0, Math.floor(buildingCount / 3))
    : randomInt(Math.floor(2 * buildingCount / 3), buildingCount - 1);

  const building = buildings[buildingIndex];

  return {
    position: {
      x: building.x + building.width / 2,
      y: canvasHeight - building.height - GORILLA_SIZE / 2,
    },
    buildingIndex,
  };
}

function simulateThrow(
  state: GorillasState,
  angle: number,
  velocity: number,
  thrower: 'player1' | 'player2'
): Trajectory {
  const gorilla = thrower === 'player1' ? state.player1 : state.player2;
  const opponent = thrower === 'player1' ? state.player2 : state.player1;

  // Adjust angle for player 2 (throwing left)
  const effectiveAngle = thrower === 'player2' ? 180 - angle : angle;
  const radians = degToRad(effectiveAngle);

  // Initial velocity components (mutable - updated each step)
  let vx = velocity * Math.cos(radians);
  let vy = -velocity * Math.sin(radians); // Negative because y increases downward

  // Starting position (from gorilla's hand)
  let x = gorilla.position.x;
  let y = gorilla.position.y - GORILLA_SIZE / 2;

  const points: Position[] = [{ x, y }];
  let t = 0;
  let hit: Trajectory['hit'] = null;
  let hitPosition: Position | undefined;

  const maxTime = 20; // Max simulation time

  while (t < maxTime && !hit) {
    t += TIME_STEP;

    // Euler integration: update velocity first, then position
    // Wind affects horizontal velocity
    vx += state.wind * TIME_STEP * 0.5; // Wind as horizontal acceleration
    // Gravity affects vertical velocity
    vy += state.gravity * TIME_STEP;

    // Update position based on current velocity
    x += vx * TIME_STEP;
    y += vy * TIME_STEP;

    points.push({ x, y });

    // Check bounds
    if (x < 0 || x > state.width || y > state.height) {
      hit = 'out-of-bounds';
      hitPosition = { x, y };
      break;
    }

    // Check sun collision
    const sunDist = Math.sqrt(
      Math.pow(x - state.sunPosition.x, 2) +
      Math.pow(y - state.sunPosition.y, 2)
    );
    if (sunDist < SUN_RADIUS + BANANA_RADIUS) {
      hit = 'sun';
      hitPosition = { x, y };
      break;
    }

    // Check opponent gorilla collision - larger hitbox for better gameplay
    const gorillaDistX = Math.abs(x - opponent.position.x);
    const gorillaDistY = Math.abs(y - opponent.position.y);
    // Hitbox is GORILLA_SIZE wide and tall (30x30), plus banana radius
    if (gorillaDistX < GORILLA_SIZE &&
        gorillaDistY < GORILLA_SIZE) {
      hit = 'gorilla';
      hitPosition = { x: opponent.position.x, y: opponent.position.y };
      break;
    }

    // Check building collision
    for (const building of state.buildings) {
      if (x >= building.x && x < building.x + building.width) {
        const col = Math.floor(x - building.x);
        const effectiveHeight = building.height - (building.damage[col] || 0);
        const buildingTop = state.height - effectiveHeight;

        if (y >= buildingTop) {
          hit = 'building';
          hitPosition = { x, y };
          break;
        }
      }
    }
  }

  return {
    points,
    hit,
    hitPosition,
    explosionRadius: EXPLOSION_RADIUS,
  };
}

function applyExplosionDamage(state: GorillasState, position: Position): GorillasState {
  const newBuildings = state.buildings.map(building => {
    // Check if explosion affects this building
    if (position.x < building.x - EXPLOSION_RADIUS ||
        position.x > building.x + building.width + EXPLOSION_RADIUS) {
      return building;
    }

    // Apply damage to affected columns
    const newDamage = [...building.damage];
    for (let col = 0; col < building.width; col++) {
      const colX = building.x + col;
      const dist = Math.abs(colX - position.x);

      if (dist < EXPLOSION_RADIUS) {
        // Calculate damage based on distance from explosion center
        const damageAmount = EXPLOSION_RADIUS - dist;
        newDamage[col] = Math.min(building.height, (newDamage[col] || 0) + damageAmount);
      }
    }

    return { ...building, damage: newDamage };
  });

  return { ...state, buildings: newBuildings };
}

function checkGorillaFall(state: GorillasState): GorillasState {
  // Check if either gorilla's building has been destroyed under them
  const checkGorilla = (gorilla: Gorilla) => {
    const building = state.buildings[gorilla.buildingIndex];
    const col = Math.floor(gorilla.position.x - building.x);
    const effectiveHeight = building.height - (building.damage[col] || 0);

    // If building is too damaged, gorilla falls
    if (effectiveHeight < GORILLA_SIZE) {
      return { ...gorilla, score: gorilla.score - 1 }; // Lose a point for falling
    }
    return gorilla;
  };

  return {
    ...state,
    player1: checkGorilla(state.player1),
    player2: checkGorilla(state.player2),
  };
}

function generateAIMove(state: GorillasState, difficulty: Difficulty): GorillasMove {
  const ai = state.player2;
  const target = state.player1;

  // Calculate distance and height difference
  const dx = target.position.x - ai.position.x;  // Negative (target is left)
  const dy = target.position.y - ai.position.y;  // Positive if target is lower
  const distance = Math.abs(dx);

  // For ballistic trajectory, use ~45° as base (optimal for max range)
  // Adjust for height difference: aim higher if target is above, lower if below
  const heightAdjustment = Math.atan2(-dy, distance) * 180 / Math.PI;
  let idealAngle = 45 + heightAdjustment * 0.5;

  // Clamp to reasonable throwing angles (10-80 degrees)
  idealAngle = Math.max(10, Math.min(80, idealAngle));

  // Estimate velocity needed based on distance
  // v = sqrt(distance * g / sin(2*angle))
  const angleRad = degToRad(idealAngle);
  let idealVelocity = Math.sqrt(Math.abs(distance * state.gravity) / Math.sin(2 * angleRad));
  idealVelocity = Math.min(180, Math.max(40, idealVelocity));

  // Apply wind compensation - positive wind blows right, so we need to aim more left (higher angle)
  // For player2, wind compensation is reversed since we're throwing left
  const windCompensation = -state.wind * (distance / 300);
  idealAngle += windCompensation;

  // Add randomness based on difficulty
  let angleError: number;
  let velocityError: number;

  switch (difficulty) {
    case 'easy':
      angleError = randomFloat(-25, 25);
      velocityError = randomFloat(-40, 40);
      break;
    case 'medium':
      angleError = randomFloat(-12, 12);
      velocityError = randomFloat(-20, 20);
      break;
    case 'hard':
      angleError = randomFloat(-5, 5);
      velocityError = randomFloat(-10, 10);
      break;
  }

  const angle = Math.max(0, Math.min(180, idealAngle + angleError));
  const velocity = Math.max(1, Math.min(200, idealVelocity + velocityError));

  return { angle: Math.round(angle), velocity: Math.round(velocity) };
}

// =============================================================================
// Helper Functions for AI/MCP
// =============================================================================

/**
 * Simulate a throw without making a move (for AI trajectory planning)
 */
export function simulateThrowPreview(state: GorillasState, angle: number, velocity: number): Trajectory {
  return simulateThrow(state, angle, velocity, state.turn === 'player' ? 'player1' : 'player2');
}

/**
 * Get strategic hints for the current situation
 */
export function getStrategicHints(state: GorillasState): {
  distance: number;
  heightDiff: number;
  suggestedAngle: number;
  suggestedVelocity: number;
  windCompensation: string;
} {
  const thrower = state.turn === 'player' ? state.player1 : state.player2;
  const target = state.turn === 'player' ? state.player2 : state.player1;

  const dx = Math.abs(target.position.x - thrower.position.x);
  const dy = target.position.y - thrower.position.y;

  // Basic trajectory calculation
  const heightAdjustment = Math.atan2(-dy, dx) * 180 / Math.PI;
  let suggestedAngle = Math.max(20, Math.min(70, 45 + heightAdjustment * 0.3));

  // Velocity estimate
  const angleRad = (suggestedAngle * Math.PI) / 180;
  let suggestedVelocity = Math.sqrt(Math.abs(dx * state.gravity) / Math.sin(2 * angleRad));
  suggestedVelocity = Math.min(180, Math.max(40, suggestedVelocity));

  // Wind compensation hint
  let windCompensation = 'none';
  if (Math.abs(state.wind) > 2) {
    if (state.wind > 0) {
      windCompensation = state.turn === 'player' ? 'aim slightly left (wind pushing right)' : 'wind helping you';
    } else {
      windCompensation = state.turn === 'player' ? 'wind helping you' : 'aim slightly right (wind pushing left)';
    }
  }

  return {
    distance: Math.round(dx),
    heightDiff: Math.round(dy),
    suggestedAngle: Math.round(suggestedAngle),
    suggestedVelocity: Math.round(suggestedVelocity),
    windCompensation,
  };
}

// =============================================================================
// Game Engine Implementation
// =============================================================================

export const GorillasEngine: GameEngine<GorillasState, GorillasMove, GorillasOptions> = {
  metadata: {
    id: 'gorillas',
    name: 'Gorillas',
    description: 'Classic artillery game - throw bananas at your opponent!',
    difficulty: 'medium',
    points: 150,
    transport: 'sse',
    minPlayers: 1,
    maxPlayers: 2,
  },

  newGame(options?: GorillasOptions): GorillasState {
    const levelIndex = options?.levelIndex ?? 0;
    const level = LEVELS[Math.min(levelIndex, LEVELS.length - 1)];

    const buildings = generateBuildings(level);
    const wind = generateWind(level.windRange);

    const sunPosition: Position = {
      x: CANVAS_WIDTH / 2,
      y: 40,
    };

    const player1Pos = placeGorilla(buildings, true, CANVAS_HEIGHT);
    const player2Pos = placeGorilla(buildings, false, CANVAS_HEIGHT);

    return {
      gameId: generateGameId(),
      gameType: 'gorillas',
      status: 'playing',
      turn: 'player',
      moveCount: 0,

      buildings,
      player1: {
        ...player1Pos,
        score: 0,
        name: options?.player1Name ?? 'Player 1',
      },
      player2: {
        ...player2Pos,
        score: 0,
        name: options?.player2Name ?? (options?.vsAI ? 'AI' : 'Player 2'),
      },

      wind,
      gravity: options?.gravity ?? level.gravity,
      levelIndex,
      totalLevels: LEVELS.length,
      pointsToWin: options?.pointsToWin ?? 3,

      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      sunPosition,

      isVsAI: options?.vsAI ?? true,
      aiDifficulty: options?.aiDifficulty ?? 'medium',
    };
  },

  validateState(state: unknown): state is GorillasState {
    if (!state || typeof state !== 'object') return false;
    const s = state as Record<string, unknown>;
    return (
      s.gameType === 'gorillas' &&
      typeof s.gameId === 'string' &&
      Array.isArray(s.buildings) &&
      typeof s.player1 === 'object' &&
      typeof s.player2 === 'object'
    );
  },

  getLegalMoves(_state: GorillasState): GorillasMove[] {
    // All angle/velocity combinations are technically legal
    // Return some example moves
    const moves: GorillasMove[] = [];
    for (let angle = 20; angle <= 80; angle += 10) {
      for (let velocity = 50; velocity <= 150; velocity += 25) {
        moves.push({ angle, velocity });
      }
    }
    return moves;
  },

  isLegalMove(_state: GorillasState, move: GorillasMove): boolean {
    return (
      typeof move.angle === 'number' &&
      typeof move.velocity === 'number' &&
      move.angle >= 0 && move.angle <= 360 &&
      move.velocity >= 1 && move.velocity <= 200
    );
  },

  makeMove(state: GorillasState, move: GorillasMove): MoveResult<GorillasState> {
    if (!this.isLegalMove(state, move)) {
      return {
        state,
        valid: false,
        error: `Invalid move. Angle must be 0-360, velocity must be 1-200.`,
      };
    }

    if (state.status !== 'playing') {
      return {
        state,
        valid: false,
        error: 'Game is not in progress.',
      };
    }

    const thrower: 'player1' | 'player2' = state.turn === 'player' ? 'player1' : 'player2';
    const trajectory = simulateThrow(state, move.angle, move.velocity, thrower);

    let newState: GorillasState = {
      ...state,
      lastTrajectory: trajectory,
      lastThrower: thrower,
      moveCount: state.moveCount + 1,
    };

    let message = '';

    if (trajectory.hit === 'gorilla') {
      // Score!
      const scorer = thrower === 'player1' ? 'player1' : 'player2';
      const scorerGorilla = newState[scorer];
      newState = {
        ...newState,
        [scorer]: { ...scorerGorilla, score: scorerGorilla.score + 1 },
      };
      message = `${scorerGorilla.name} hit! Score: ${scorerGorilla.score + 1}`;

      // Check for win
      if (scorerGorilla.score + 1 >= state.pointsToWin) {
        return {
          state: { ...newState, status: 'won', message },
          valid: true,
          result: {
            status: thrower === 'player1' ? 'won' : 'lost',
            totalMoves: newState.moveCount,
            metadata: {
              winner: scorerGorilla.name,
              finalScore: `${newState.player1.score}-${newState.player2.score}`,
            },
          },
        };
      }

      // New round - regenerate wind
      const level = LEVELS[Math.min(state.levelIndex, LEVELS.length - 1)];
      newState = { ...newState, wind: generateWind(level.windRange) };
    } else if (trajectory.hit === 'building' && trajectory.hitPosition) {
      // Apply explosion damage
      newState = applyExplosionDamage(newState, trajectory.hitPosition);
      newState = checkGorillaFall(newState);
      message = 'Building hit!';
    } else if (trajectory.hit === 'sun') {
      message = 'You hit the sun! It got angry!';
    } else {
      message = 'Missed! Out of bounds.';
    }

    // Switch turns
    newState = {
      ...newState,
      turn: state.turn === 'player' ? 'opponent' : 'player',
      message,
    };

    return { state: newState, valid: true };
  },

  getAIMove(state: GorillasState, difficulty?: Difficulty): GorillasMove | null {
    if (state.status !== 'playing') return null;
    return generateAIMove(state, difficulty ?? state.aiDifficulty);
  },

  isGameOver(state: GorillasState): boolean {
    return state.status === 'won' || state.status === 'lost' || state.status === 'draw';
  },

  getResult(state: GorillasState): GameResult | null {
    if (!this.isGameOver(state)) return null;

    const player1Won = state.player1.score >= state.pointsToWin;
    const player2Won = state.player2.score >= state.pointsToWin;

    return {
      status: player1Won ? 'won' : player2Won ? 'lost' : 'draw',
      totalMoves: state.moveCount,
      metadata: {
        player1Score: state.player1.score,
        player2Score: state.player2.score,
        winner: player1Won ? state.player1.name : state.player2.name,
      },
    };
  },

  serialize(state: GorillasState): string {
    return JSON.stringify(state);
  },

  deserialize(data: string): GorillasState {
    const state = JSON.parse(data);
    if (!this.validateState(state)) {
      throw new Error('Invalid Gorillas state data');
    }
    return state;
  },

  renderText(state: GorillasState): string {
    const level = LEVELS[Math.min(state.levelIndex, LEVELS.length - 1)];
    const windDir = state.wind > 0 ? '→' : state.wind < 0 ? '←' : '-';
    const windStr = `${windDir} ${Math.abs(state.wind).toFixed(1)}`;
    const hints = getStrategicHints(state);

    let text = `
🦍 GORILLAS - Level ${state.levelIndex + 1}: ${level.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${state.player1.name}: ${'🍌'.repeat(state.player1.score)} (${state.player1.score}/${state.pointsToWin})
${state.player2.name}: ${'🍌'.repeat(state.player2.score)} (${state.player2.score}/${state.pointsToWin})

🌬️ Wind: ${windStr} mph  |  ⬇️ Gravity: ${state.gravity} m/s²

📍 Distance to target: ${hints.distance} units
📐 Height difference: ${hints.heightDiff > 0 ? 'target is lower' : hints.heightDiff < 0 ? 'target is higher' : 'same height'} (${Math.abs(hints.heightDiff)} units)

🎯 Current turn: ${state.turn === 'player' ? state.player1.name : state.player2.name}
`;

    if (state.message) {
      text += `\n📢 ${state.message}\n`;
    }

    if (state.lastTrajectory) {
      text += `\n🍌 Last throw result: ${state.lastTrajectory.hit || 'out of bounds'}`;
    }

    text += `\n
💡 STRATEGY HINTS:
   • Suggested angle: ~${hints.suggestedAngle}° (adjust based on obstacles)
   • Suggested velocity: ~${hints.suggestedVelocity} (adjust for wind)
   • Wind effect: ${hints.windCompensation}

📝 Commands:
   throw_banana(angle, velocity) - angle: 0-90°, velocity: 10-200
   Example: throw_banana(${hints.suggestedAngle}, ${hints.suggestedVelocity})`;

    return text;
  },

  renderJSON(state: GorillasState): GameStateJSON {
    const level = LEVELS[Math.min(state.levelIndex, LEVELS.length - 1)];
    const hints = getStrategicHints(state);

    return {
      gameType: 'gorillas',
      gameId: state.gameId,
      status: state.status,
      turn: state.turn,
      moveCount: state.moveCount,
      legalMoves: ['throw_banana(angle: 0-90, velocity: 10-200)'],
      board: {
        width: state.width,
        height: state.height,
        buildings: state.buildings.map(b => ({
          x: b.x,
          width: b.width,
          height: b.height,
          // Simplified damage info - just max damage
          maxDamage: Math.max(...(b.damage || [0])),
        })),
        player1: {
          position: state.player1.position,
          score: state.player1.score,
          name: state.player1.name,
        },
        player2: {
          position: state.player2.position,
          score: state.player2.score,
          name: state.player2.name,
        },
        sunPosition: state.sunPosition,
        wind: state.wind,
        gravity: state.gravity,
        lastThrowResult: state.lastTrajectory?.hit || null,
      },
      extra: {
        levelIndex: state.levelIndex,
        levelName: level.name,
        levelDescription: level.description,
        totalLevels: state.totalLevels,
        pointsToWin: state.pointsToWin,
        isVsAI: state.isVsAI,
        message: state.message,
        // Strategic hints for AI
        hints: {
          distanceToTarget: hints.distance,
          heightDifference: hints.heightDiff,
          suggestedAngle: hints.suggestedAngle,
          suggestedVelocity: hints.suggestedVelocity,
          windCompensation: hints.windCompensation,
          tip: state.wind > 5 ? 'Strong wind - consider lower angle with more velocity' :
               state.wind < -5 ? 'Strong wind - wind will help carry the banana' :
               'Moderate conditions - standard trajectory should work',
        },
      },
    };
  },

  formatMove(move: GorillasMove): string {
    return `angle=${move.angle}°, velocity=${move.velocity}`;
  },

  parseMove(input: string): GorillasMove | null {
    // Parse formats:
    // "45, 100" or "45 100" or "angle=45, velocity=100"
    const cleanInput = input.toLowerCase().replace(/[°]/g, '');

    // Try "angle=X, velocity=Y" format
    const namedMatch = cleanInput.match(/angle\s*[=:]\s*(\d+).*velocity\s*[=:]\s*(\d+)/);
    if (namedMatch) {
      return {
        angle: parseInt(namedMatch[1]),
        velocity: parseInt(namedMatch[2]),
      };
    }

    // Try "X, Y" or "X Y" format
    const simpleMatch = cleanInput.match(/(\d+)\s*[,\s]\s*(\d+)/);
    if (simpleMatch) {
      return {
        angle: parseInt(simpleMatch[1]),
        velocity: parseInt(simpleMatch[2]),
      };
    }

    return null;
  },
};

// Export level data for UI
export { LEVELS };
export type { LevelConfig };
