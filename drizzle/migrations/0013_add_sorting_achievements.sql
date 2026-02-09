-- Add Sorting Algorithm challenge achievements

-- Sorting achievements - per expert recommendation
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('sorting-first', 'First Sort', 'Complete your first sorting challenge', '📊', 'challenge', 50, 'common'),
  ('sorting-bubble-master', 'Bubble Master', 'Complete Level 1 (3 elements) with perfect score', '🫧', 'challenge', 25, 'common'),
  ('sorting-quick-thinker', 'Quick Thinker', 'Beat par on Level 6 (20 elements) - requires O(n log n) thinking', '⚡', 'challenge', 150, 'rare'),
  ('sorting-minimal-swapper', 'Minimal Swapper', 'Complete any level with fewer swaps than par', '🎯', 'challenge', 100, 'rare'),
  ('sorting-all-levels', 'Sorting Master', 'Complete all 10 sorting levels', '👑', 'challenge', 300, 'epic'),
  ('sorting-gauntlet', 'The Gauntlet Champion', 'Beat par on Level 10 (100 elements)', '🏆', 'challenge', 500, 'legendary');
