-- Challenge Progress: tracks which levels are unlocked per challenge
CREATE TABLE challenge_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  max_level_unlocked INTEGER NOT NULL DEFAULT 1,
  last_level INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX idx_progress_user_challenge ON challenge_progress(user_id, challenge_id);
CREATE INDEX idx_progress_user ON challenge_progress(user_id);

-- Level Best: tracks best scores per level
CREATE TABLE level_best (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  best_moves INTEGER,
  best_pushes INTEGER,
  best_time_ms INTEGER,
  best_replay_id TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX idx_level_best_unique ON level_best(user_id, challenge_id, level_id);
CREATE INDEX idx_level_best_user ON level_best(user_id);

-- Replays: stores game replay data
CREATE TABLE replays (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  challenge_id TEXT NOT NULL,
  level_id TEXT,
  seed TEXT,
  moves_json TEXT NOT NULL,
  result_json TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX idx_replays_user ON replays(user_id);
CREATE INDEX idx_replays_challenge ON replays(challenge_id);

-- Share Links: short codes for sharing replays
CREATE TABLE share_links (
  id TEXT PRIMARY KEY,
  replay_id TEXT NOT NULL REFERENCES replays(id) ON DELETE CASCADE,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'unlisted',
  expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX idx_share_links_replay ON share_links(replay_id);
