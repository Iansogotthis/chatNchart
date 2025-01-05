CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  sender_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_project_messages 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_sender_messages
    FOREIGN KEY (sender_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
