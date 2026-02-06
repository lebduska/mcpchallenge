/**
 * Poly Bridge Level Definitions
 */

export interface Point {
  x: number;
  y: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  /** Ground/terrain polygon points */
  terrain: Point[];
  /** Fixed anchor points where structures can connect */
  anchors: Point[];
  /** Vehicle start position */
  vehicleStart: Point;
  /** Target position vehicle must reach */
  vehicleEnd: Point;
  /** Maximum budget for structures */
  budget: number;
  /** Vehicle weight multiplier */
  vehicleWeight: number;
  /** Canvas dimensions */
  width: number;
  height: number;
}

// Material costs per unit length
export const MATERIAL_COSTS = {
  wood: 10,
  steel: 25,
  cable: 15,
  road: 20,
} as const;

export type MaterialType = keyof typeof MATERIAL_COSTS;

/**
 * Level 1: Simple Gap
 * A small gap that can be bridged with a single beam
 */
const level1: Level = {
  id: 'level-1',
  name: 'Simple Gap',
  description: 'Build a simple bridge across a small gap',
  width: 800,
  height: 400,
  terrain: [
    // Left platform
    { x: 0, y: 300 },
    { x: 250, y: 300 },
    { x: 250, y: 400 },
    { x: 0, y: 400 },
  ],
  anchors: [
    { x: 250, y: 300 },  // Left edge
    { x: 550, y: 300 },  // Right edge
  ],
  vehicleStart: { x: 100, y: 280 },
  vehicleEnd: { x: 700, y: 280 },
  budget: 500,
  vehicleWeight: 1,
};

// Add right platform to level 1 terrain
const level1RightTerrain: Point[] = [
  { x: 550, y: 300 },
  { x: 800, y: 300 },
  { x: 800, y: 400 },
  { x: 550, y: 400 },
];

/**
 * Level 2: Medium Gap
 * Requires support structure
 */
const level2: Level = {
  id: 'level-2',
  name: 'Medium Gap',
  description: 'A wider gap - you may need support',
  width: 800,
  height: 400,
  terrain: [
    // Left platform
    { x: 0, y: 280 },
    { x: 200, y: 280 },
    { x: 200, y: 400 },
    { x: 0, y: 400 },
  ],
  anchors: [
    { x: 200, y: 280 },
    { x: 200, y: 200 },  // Upper anchor for support
    { x: 600, y: 280 },
    { x: 600, y: 200 },
  ],
  vehicleStart: { x: 80, y: 260 },
  vehicleEnd: { x: 720, y: 260 },
  budget: 800,
  vehicleWeight: 1,
};

/**
 * Level 3: Wide Gap
 * Requires truss structure
 */
const level3: Level = {
  id: 'level-3',
  name: 'Wide Gap',
  description: 'Build a truss bridge to span this wide gap',
  width: 900,
  height: 450,
  terrain: [
    // Left cliff
    { x: 0, y: 250 },
    { x: 150, y: 250 },
    { x: 150, y: 450 },
    { x: 0, y: 450 },
  ],
  anchors: [
    { x: 150, y: 250 },
    { x: 150, y: 180 },
    { x: 750, y: 250 },
    { x: 750, y: 180 },
  ],
  vehicleStart: { x: 60, y: 230 },
  vehicleEnd: { x: 840, y: 230 },
  budget: 1200,
  vehicleWeight: 1.2,
};

/**
 * Level 4: Valley
 * Multi-section bridge with pier support
 */
const level4: Level = {
  id: 'level-4',
  name: 'The Valley',
  description: 'Build across a deep valley with a center support',
  width: 1000,
  height: 500,
  terrain: [
    // Left cliff
    { x: 0, y: 200 },
    { x: 150, y: 200 },
    { x: 150, y: 500 },
    { x: 0, y: 500 },
  ],
  anchors: [
    { x: 150, y: 200 },
    { x: 150, y: 130 },
    { x: 500, y: 350 },  // Center pier base
    { x: 500, y: 200 },  // Center pier top
    { x: 850, y: 200 },
    { x: 850, y: 130 },
  ],
  vehicleStart: { x: 60, y: 180 },
  vehicleEnd: { x: 940, y: 180 },
  budget: 1500,
  vehicleWeight: 1.5,
};

/**
 * Level 5: Canyon
 * Requires suspension cable design
 */
const level5: Level = {
  id: 'level-5',
  name: 'Canyon Crossing',
  description: 'Build a suspension bridge across the canyon',
  width: 1100,
  height: 550,
  terrain: [
    // Left cliff with tower base
    { x: 0, y: 180 },
    { x: 180, y: 180 },
    { x: 180, y: 550 },
    { x: 0, y: 550 },
  ],
  anchors: [
    // Left side
    { x: 180, y: 180 },
    { x: 180, y: 80 },   // Tower top
    // Center supports (very deep)
    { x: 400, y: 180 },
    { x: 550, y: 180 },
    { x: 700, y: 180 },
    // Right side
    { x: 920, y: 180 },
    { x: 920, y: 80 },   // Tower top
  ],
  vehicleStart: { x: 60, y: 160 },
  vehicleEnd: { x: 1040, y: 160 },
  budget: 2000,
  vehicleWeight: 2,
};

// Combine all terrain pieces for levels
level1.terrain = [
  ...level1.terrain,
  ...level1RightTerrain,
];

level2.terrain = [
  ...level2.terrain,
  // Right platform
  { x: 600, y: 280 },
  { x: 800, y: 280 },
  { x: 800, y: 400 },
  { x: 600, y: 400 },
];

level3.terrain = [
  ...level3.terrain,
  // Right cliff
  { x: 750, y: 250 },
  { x: 900, y: 250 },
  { x: 900, y: 450 },
  { x: 750, y: 450 },
];

level4.terrain = [
  ...level4.terrain,
  // Center pier
  { x: 480, y: 350 },
  { x: 520, y: 350 },
  { x: 520, y: 500 },
  { x: 480, y: 500 },
  // Right cliff
  { x: 850, y: 200 },
  { x: 1000, y: 200 },
  { x: 1000, y: 500 },
  { x: 850, y: 500 },
];

level5.terrain = [
  ...level5.terrain,
  // Right cliff with tower base
  { x: 920, y: 180 },
  { x: 1100, y: 180 },
  { x: 1100, y: 550 },
  { x: 920, y: 550 },
];

export const LEVELS: Level[] = [level1, level2, level3, level4, level5];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find(l => l.id === id);
}

export function getLevelByIndex(index: number): Level | undefined {
  return LEVELS[index];
}
