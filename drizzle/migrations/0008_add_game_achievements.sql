-- Add missing game achievements

-- Tic-Tac-Toe master achievement (referenced in code but missing)
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('ttt-master', 'Tic-Tac-Toe Master', 'Win 5 games of Tic-Tac-Toe', '🏆', 'challenge', 75, 'rare');

-- Minesweeper achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('minesweeper-win', 'Mine Sweeper', 'Complete a minesweeper game', '💣', 'challenge', 50, 'common'),
  ('minesweeper-expert', 'Bomb Defuser', 'Complete minesweeper on expert difficulty', '🛡️', 'challenge', 150, 'epic');

-- Sokoban achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('sokoban-10', 'Box Pusher', 'Complete 10 Sokoban levels', '📦', 'challenge', 75, 'common'),
  ('sokoban-30', 'Warehouse Worker', 'Complete 30 Sokoban levels', '🏭', 'challenge', 150, 'rare'),
  ('sokoban-complete', 'Sokoban Master', 'Complete all 60 Sokoban levels', '👑', 'challenge', 500, 'legendary');
