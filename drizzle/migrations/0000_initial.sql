-- Initial migration for MCP Challenge
-- Auth tables (NextAuth compatible) + Achievement system

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER,
  name TEXT,
  username TEXT UNIQUE,
  image TEXT,
  bio TEXT,
  password_hash TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Accounts table (OAuth providers)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  requirement TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at INTEGER DEFAULT (unixepoch()),
  metadata TEXT
);

-- Challenge completions table
CREATE TABLE IF NOT EXISTS challenge_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  score INTEGER,
  time_spent_ms INTEGER,
  completed_at INTEGER DEFAULT (unixepoch()),
  metadata TEXT
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  achievements_unlocked INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_at INTEGER,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_id ON challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge_id ON challenge_completions(challenge_id);

-- Seed initial achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity) VALUES
  ('first-login', 'First Steps', 'Create your account and join MCP Challenge', '🚀', 'milestone', 10, 'common'),
  ('first-challenge', 'Challenge Accepted', 'Complete your first challenge', '🏁', 'milestone', 25, 'common'),
  ('chess-win', 'Checkmate!', 'Win a game of chess against the AI', '♔', 'challenge', 50, 'common'),
  ('chess-master', 'Chess Master', 'Win 10 games of chess', '🏆', 'challenge', 200, 'rare'),
  ('chess-speedrun', 'Lightning Fast', 'Win a chess game in under 20 moves', '⚡', 'challenge', 100, 'epic'),
  ('snake-10', 'Snake Charmer', 'Score 10 points in Snake', '🐍', 'challenge', 50, 'common'),
  ('snake-25', 'Serpent Master', 'Score 25 points in Snake', '🐍', 'challenge', 100, 'rare'),
  ('snake-50', 'Snake God', 'Score 50 points in Snake', '👑', 'challenge', 300, 'legendary'),
  ('ttt-win', 'X Marks the Spot', 'Win a game of Tic-Tac-Toe', '❌', 'challenge', 25, 'common'),
  ('ttt-draw-ai', 'Perfect Defense', 'Force a draw against the unbeatable AI', '🛡️', 'challenge', 75, 'rare'),
  ('level-5', 'Rising Star', 'Reach level 5', '⭐', 'milestone', 100, 'common'),
  ('level-10', 'MCP Enthusiast', 'Reach level 10', '🌟', 'milestone', 250, 'rare'),
  ('streak-7', 'Week Warrior', 'Maintain a 7-day activity streak', '🔥', 'milestone', 150, 'rare'),
  ('all-games', 'Game Master', 'Complete all game challenges', '🎮', 'milestone', 200, 'epic');
