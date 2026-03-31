-- Hard-delete soft-deleted rows before dropping the status columns
DELETE FROM relations WHERE status = 'deleted';
DELETE FROM entities WHERE status = 'deleted';

-- Drop status columns
ALTER TABLE entities DROP COLUMN IF EXISTS status;
ALTER TABLE relations DROP COLUMN IF EXISTS status;
