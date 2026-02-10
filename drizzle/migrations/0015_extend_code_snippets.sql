-- Extend code_snippets table for curated snippets feature
ALTER TABLE code_snippets ADD COLUMN is_curated INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE code_snippets ADD COLUMN client_type TEXT;
ALTER TABLE code_snippets ADD COLUMN sort_order INTEGER DEFAULT 0 NOT NULL;

-- Index for faster queries on curated snippets per challenge
CREATE INDEX IF NOT EXISTS idx_code_snippets_curated_challenge
ON code_snippets(challenge_id, is_curated, sort_order);
