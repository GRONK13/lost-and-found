-- Add messages table for chat
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  claim_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_messages_claim_id ON messages(claim_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
-- Users can read messages for claims they're involved in
CREATE POLICY "Users can read their claim messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      LEFT JOIN items i ON c.item_id = i.id
      WHERE c.id = messages.claim_id
      AND (c.claimant_id = auth.uid() OR i.reporter_id = auth.uid())
    )
  );

-- Users can insert messages for claims they're involved in
CREATE POLICY "Users can send messages to their claims"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM claims c
      LEFT JOIN items i ON c.item_id = i.id
      WHERE c.id = claim_id
      AND (c.claimant_id = auth.uid() OR i.reporter_id = auth.uid())
    )
  );
