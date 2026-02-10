-- Add referredBy column to users table
ALTER TABLE users ADD COLUMN referred_by TEXT;

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_used TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  qualified_at INTEGER,
  rewarded_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
