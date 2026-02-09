-- Add achievements for Gorillas, Fractals, Lights Out, and Pathfinding challenges

-- ============================================================================
-- GORILLAS - Classic artillery game with banana-throwing gorillas
-- ============================================================================
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('gorillas-first-win', 'Banana Slinger', 'Win your first Gorillas game vs AI', '🍌', 'challenge', 50, 'common'),
  ('gorillas-no-miss', 'Perfect Aim', 'Win a Gorillas game without missing a single throw', '🎯', 'challenge', 150, 'rare'),
  ('gorillas-sun-hit', 'Sun Struck', 'Hit the sun with a banana (Easter egg!)', '☀️', 'challenge', 100, 'rare'),
  ('gorillas-speedrun', 'Quick Draw', 'Win a Gorillas game in 3 or fewer throws', '⚡', 'challenge', 200, 'epic'),
  ('gorillas-master', 'Gorilla King', 'Win 10 Gorillas games vs AI', '🦍', 'challenge', 250, 'epic');

-- ============================================================================
-- FRACTALS - L-System fractal generator with turtle graphics
-- ============================================================================
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('fractals-first', 'Fractal Explorer', 'Generate your first fractal', '🌿', 'challenge', 50, 'common'),
  ('fractals-presets', 'Preset Master', 'Try all built-in fractal presets', '🎨', 'challenge', 100, 'rare'),
  ('fractals-custom', 'Rule Maker', 'Create a fractal with custom L-System rules', '🔧', 'challenge', 100, 'rare'),
  ('fractals-deep', 'Into the Abyss', 'Generate a fractal with 6+ iterations', '🌀', 'challenge', 150, 'rare'),
  ('fractals-gallery', 'Gallery Artist', 'Save 5 fractals to the gallery', '🖼️', 'challenge', 200, 'epic');

-- ============================================================================
-- LIGHTS OUT - Classic 90s puzzle game with XOR logic
-- ============================================================================
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('lightsout-first', 'Lights Off', 'Solve your first Lights Out puzzle', '💡', 'challenge', 50, 'common'),
  ('lightsout-easy', 'Easy Mode', 'Solve a Lights Out puzzle on Easy difficulty', '🟢', 'challenge', 25, 'common'),
  ('lightsout-medium', 'Getting Harder', 'Solve a Lights Out puzzle on Medium difficulty', '🟡', 'challenge', 75, 'common'),
  ('lightsout-hard', 'Lights Master', 'Solve a Lights Out puzzle on Hard difficulty', '🔴', 'challenge', 150, 'rare'),
  ('lightsout-optimal', 'Optimal Solution', 'Solve a puzzle with the minimum number of moves', '⭐', 'challenge', 200, 'epic'),
  ('lightsout-speed', 'Speed Runner', 'Solve any puzzle in under 30 seconds', '⏱️', 'challenge', 100, 'rare');

-- ============================================================================
-- PATHFINDING - A*, Dijkstra, BFS visualization and challenges
-- ============================================================================
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('pathfinding-first', 'Pathfinder', 'Find your first path to the goal', '🗺️', 'challenge', 50, 'common'),
  ('pathfinding-algorithms', 'Algorithm Explorer', 'Use all three pathfinding algorithms (BFS, Dijkstra, A*)', '🔬', 'challenge', 100, 'rare'),
  ('pathfinding-level5', 'Maze Runner', 'Complete 5 pathfinding challenge levels', '🏃', 'challenge', 150, 'rare'),
  ('pathfinding-all-levels', 'Pathfinding Master', 'Complete all pathfinding challenge levels', '👑', 'challenge', 300, 'epic'),
  ('pathfinding-beat-par', 'Efficiency Expert', 'Beat the par cost on any challenge level', '📊', 'challenge', 100, 'rare'),
  ('pathfinding-perfect', 'Perfect Path', 'Find the optimal path with minimum nodes expanded', '✨', 'challenge', 250, 'legendary');
