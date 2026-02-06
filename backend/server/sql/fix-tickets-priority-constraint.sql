-- Fix: new row for relation "tickets" violates check constraint "tickets_priority_check"
-- The app uses: lowest, low, medium, high, highest. Run in Supabase SQL Editor.

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_priority_check;

ALTER TABLE tickets ADD CONSTRAINT tickets_priority_check
  CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest'));
