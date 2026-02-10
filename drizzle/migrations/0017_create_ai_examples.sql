-- AI Examples table for pre-built AI implementations
CREATE TABLE IF NOT EXISTS ai_examples (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  strategy TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  language TEXT NOT NULL DEFAULT 'typescript',
  code TEXT NOT NULL,
  ai_provider TEXT,
  estimated_tokens INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

-- Index for faster lookups by challenge
CREATE INDEX IF NOT EXISTS idx_ai_examples_challenge
ON ai_examples(challenge_id, sort_order);

-- Index for filtering by strategy/provider
CREATE INDEX IF NOT EXISTS idx_ai_examples_strategy
ON ai_examples(strategy, ai_provider);
