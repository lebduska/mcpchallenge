-- Code snippets for sharing MCP configs and code
CREATE TABLE IF NOT EXISTS code_snippets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'json',
  code TEXT NOT NULL,
  challenge_id TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_snippets_user ON code_snippets(user_id);
CREATE INDEX idx_snippets_challenge ON code_snippets(challenge_id);
CREATE INDEX idx_snippets_public ON code_snippets(is_public, created_at DESC);

-- Challenge discussions/comments
CREATE TABLE IF NOT EXISTS challenge_comments (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES challenge_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_tip INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_comments_challenge ON challenge_comments(challenge_id, created_at DESC);
CREATE INDEX idx_comments_user ON challenge_comments(user_id);
CREATE INDEX idx_comments_parent ON challenge_comments(parent_id);

-- Likes for challenge comments
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES challenge_comments(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, comment_id)
);
