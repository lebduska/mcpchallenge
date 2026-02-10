-- Add PvP stats to user_stats
ALTER TABLE user_stats ADD COLUMN pvp_wins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN pvp_losses INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN pvp_rating INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE user_stats ADD COLUMN pvp_win_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN pvp_best_win_streak INTEGER NOT NULL DEFAULT 0;

-- Create pvp_matches table
CREATE TABLE IF NOT EXISTS pvp_matches (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  white_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  black_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  winner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  result TEXT NOT NULL DEFAULT 'pending',
  white_rating_before INTEGER,
  black_rating_before INTEGER,
  white_rating_change INTEGER,
  black_rating_change INTEGER,
  moves_json TEXT,
  total_moves INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  started_at INTEGER DEFAULT (unixepoch()),
  ended_at INTEGER
);

-- Create matchmaking_queue table
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'waiting',
  matched_with_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  matched_room_id TEXT,
  joined_at INTEGER DEFAULT (unixepoch()),
  matched_at INTEGER
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pvp_matches_white_user ON pvp_matches(white_user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_black_user ON pvp_matches(black_user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_game_type ON pvp_matches(game_type);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_result ON pvp_matches(result);
CREATE INDEX IF NOT EXISTS idx_matchmaking_status ON matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_game_type ON matchmaking_queue(game_type);
CREATE INDEX IF NOT EXISTS idx_matchmaking_user ON matchmaking_queue(user_id);
