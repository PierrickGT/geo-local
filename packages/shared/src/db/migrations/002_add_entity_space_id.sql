-- Add space_id to entities
ALTER TABLE entities ADD COLUMN IF NOT EXISTS space_id char(32);
