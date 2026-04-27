-- Add decoded_ops column for storing serialized op data on applied edits.
ALTER TABLE edits ADD COLUMN IF NOT EXISTS decoded_ops jsonb NULL;
