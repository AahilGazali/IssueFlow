-- Fix: "column tickets.created_by does not exist"
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by UUID;

COMMENT ON COLUMN tickets.created_by IS 'User (auth.users.id) who created the ticket';
