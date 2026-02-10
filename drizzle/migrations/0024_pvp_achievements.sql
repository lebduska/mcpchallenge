-- Add PvP achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('pvp-first-win', 'Gladiator', 'Win your first PvP match', '⚔️', 'pvp', 50, 'rare'),
  ('pvp-champion', 'Champion', 'Win 50 PvP matches', '👑', 'pvp', 300, 'legendary'),
  ('pvp-streak-5', 'Dominator', 'Achieve a 5-win streak in PvP', '🔥', 'pvp', 150, 'epic'),
  ('pvp-rating-1500', 'Elite Player', 'Reach 1500 PvP rating', '⭐', 'pvp', 200, 'epic');
