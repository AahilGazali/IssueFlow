-- Optional columns for tickets (run in Supabase SQL Editor if you see "column not found" errors)
-- Who created the ticket (UUID from auth.users) – required for comments/notifications
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by UUID;
-- Type: bug, task, feature, improvement, epic
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'task';
-- Assignee user id (UUID from auth.users)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assignee UUID;
-- Labels array
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
-- Due date for tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS due_date DATE;
-- Updated timestamp (for drag-and-drop and edits)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- Story points (optional)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS story_points INTEGER;
-- Subtasks: JSONB array e.g. [{"id":"uuid","title":"Subtask 1","completed":false}]
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]';
-- Linked ticket IDs (same project): UUID array
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS linked_ticket_ids UUID[] DEFAULT '{}';

-- Soft delete for projects (deleted projects go to trash, can be restored)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
