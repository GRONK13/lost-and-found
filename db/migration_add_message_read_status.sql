-- Add read status to messages table
ALTER TABLE messages ADD COLUMN read BOOLEAN DEFAULT FALSE;

-- Add index for unread messages
CREATE INDEX idx_messages_unread ON messages(claim_id, read) WHERE read = FALSE;

-- Update policy to allow users to update read status on their own messages
CREATE POLICY "Users can update read status on messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM claims c
      LEFT JOIN items i ON c.item_id = i.id
      WHERE c.id = messages.claim_id
      AND (c.claimant_id = auth.uid() OR i.reporter_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims c
      LEFT JOIN items i ON c.item_id = i.id
      WHERE c.id = messages.claim_id
      AND (c.claimant_id = auth.uid() OR i.reporter_id = auth.uid())
    )
  );
