-- Add referral-related achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('referral-first', 'Networker', 'Successfully referred your first friend', '🤝', 'social', 50, 'rare'),
  ('referral-5', 'Influencer', 'Referred 5 friends who completed challenges', '⭐', 'social', 200, 'epic'),
  ('referred-friend', 'Welcome Gift', 'Joined MCP Challenge via a friend''s referral', '🎁', 'social', 25, 'common');
