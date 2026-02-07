-- Migration: Add Challenge Ideas System
-- Tables for community-submitted challenge ideas with voting and comments

-- Challenge Ideas table
CREATE TABLE IF NOT EXISTS challenge_ideas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'game', -- 'game' | 'creative' | 'puzzle' | 'educational'
  game_reference TEXT, -- Reference to existing game/concept (e.g., "Tetris", "2048")
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'in_progress' | 'implemented' | 'rejected'
  is_featured INTEGER NOT NULL DEFAULT 0, -- Featured/top ideas
  vote_count INTEGER NOT NULL DEFAULT 0, -- Cached vote count for sorting
  comment_count INTEGER NOT NULL DEFAULT 0, -- Cached comment count
  admin_notes TEXT, -- Notes from admin/moderators
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Idea Votes table (upvotes/likes)
CREATE TABLE IF NOT EXISTS idea_votes (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES challenge_ideas(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL DEFAULT 1, -- 1 = upvote, -1 = downvote (for future)
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(idea_id, user_id) -- One vote per user per idea
);

-- Idea Comments table
CREATE TABLE IF NOT EXISTS idea_comments (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES challenge_ideas(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES idea_comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  is_edited INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON challenge_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON challenge_ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_featured ON challenge_ideas(is_featured);
CREATE INDEX IF NOT EXISTS idx_ideas_vote_count ON challenge_ideas(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON challenge_ideas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_idea_votes_idea_id ON idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_user_id ON idea_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_idea_comments_idea_id ON idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_user_id ON idea_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_parent_id ON idea_comments(parent_id);
