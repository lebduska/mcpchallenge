-- Add agent snapshot to replays table
-- Stores JSON snapshot of agent identity when replay was created
ALTER TABLE replays ADD COLUMN agent_snapshot_json TEXT;
