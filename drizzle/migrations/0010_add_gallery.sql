-- Gallery images table for storing creative challenge outputs
CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  challenge_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  title TEXT,
  width INTEGER NOT NULL DEFAULT 512,
  height INTEGER NOT NULL DEFAULT 512,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  is_public INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gallery_user ON gallery_images(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_challenge ON gallery_images(challenge_id);
CREATE INDEX IF NOT EXISTS idx_gallery_public ON gallery_images(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_r2_key ON gallery_images(r2_key);
