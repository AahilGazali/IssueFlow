-- Comments on tickets (run in Supabase SQL Editor if the table does not exist)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

COMMENT ON TABLE comments IS 'Activity comments on tickets';
