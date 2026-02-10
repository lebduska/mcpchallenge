-- Daily Challenge Achievements
INSERT INTO achievements (id, name, description, icon, category, points, rarity, created_at)
VALUES
  ('daily-first', 'Daily Warrior', 'Complete your first daily challenge', '📅', 'milestone', 25, 'common', strftime('%s', 'now')),
  ('daily-streak-7', 'Week Warrior', 'Complete daily challenges 7 days in a row', '🔥', 'milestone', 100, 'rare', strftime('%s', 'now')),
  ('daily-streak-30', 'Month Master', 'Complete daily challenges 30 days in a row', '🏆', 'milestone', 500, 'legendary', strftime('%s', 'now'));
