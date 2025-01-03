
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
