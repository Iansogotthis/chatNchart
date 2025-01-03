-- Add missing columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'unread';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_important boolean NOT NULL DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS project_id integer;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS folder text;
