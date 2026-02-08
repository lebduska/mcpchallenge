-- Update achievement rarity for sexy tier system
-- Distribution: Common 60%, Rare 25%, Epic 10%, Legendary 5%

-- LEGENDARY (5%) - Exceptional mastery, requires significant dedication
UPDATE achievements SET rarity = 'legendary', points = 500 WHERE id = 'sokoban-complete';
UPDATE achievements SET rarity = 'legendary', points = 400 WHERE id IN (
  'chess-master',
  'snake-master'
);

-- EPIC (10%) - Impressive feats, challenging accomplishments
UPDATE achievements SET rarity = 'epic', points = 200 WHERE id IN (
  'minesweeper-expert',
  'ttt-master',
  'chess-strategist'
);
UPDATE achievements SET rarity = 'epic', points = 150 WHERE id IN (
  'sokoban-30',
  'snake-survivor'
);

-- RARE (25%) - Notable achievements, requires skill
UPDATE achievements SET rarity = 'rare', points = 100 WHERE id IN (
  'chess-win',
  'sokoban-10',
  'snake-intermediate'
);
UPDATE achievements SET rarity = 'rare', points = 75 WHERE id IN (
  'ttt-win',
  'minesweeper-win',
  'canvas-artist'
);

-- COMMON (60%) - Basic accomplishments, entry-level
UPDATE achievements SET rarity = 'common', points = 50 WHERE id IN (
  'first-move',
  'first-game',
  'hello-mcp'
);
UPDATE achievements SET rarity = 'common', points = 25 WHERE id IN (
  'snake-beginner',
  'canvas-first-draw'
);

-- Ensure all achievements have explicit rarity (default to common if unset)
UPDATE achievements SET rarity = 'common' WHERE rarity IS NULL OR rarity = '';
