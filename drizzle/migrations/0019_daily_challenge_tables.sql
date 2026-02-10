-- Daily Challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  challenge_id TEXT NOT NULL,
  seed TEXT,
  difficulty TEXT NOT NULL DEFAULT 'normal',
  bonus_points INTEGER NOT NULL DEFAULT 50,
  created_at INTEGER
);

-- Daily Challenge Completions table
CREATE TABLE IF NOT EXISTS daily_challenge_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_challenge_id TEXT NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  time_spent_ms INTEGER,
  completed_at INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX IF NOT EXISTS idx_daily_completions_user ON daily_challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_completions_challenge ON daily_challenge_completions(daily_challenge_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_completions_unique ON daily_challenge_completions(user_id, daily_challenge_id);

-- Extend user_stats with daily streak fields
ALTER TABLE user_stats ADD COLUMN daily_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN longest_daily_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN last_daily_completed_at INTEGER;
