# Database Migrations to Run

You need to run these SQL migrations in your Supabase SQL Editor to enable all features:

## 1. Add `chat_type` column to claims table
**File:** `db/migration_add_chat_type.sql`

This separates regular chat conversations from claim requests.

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE claims ADD COLUMN chat_type TEXT DEFAULT 'claim';

-- Update existing discuss-type messages to be chat type
UPDATE claims SET chat_type = 'chat' WHERE status = 'discuss';

-- Add index for performance
CREATE INDEX idx_claims_chat_type ON claims(chat_type);
```

## 2. Add `read` status to messages table
**File:** `db/migration_add_message_read_status.sql`

This enables unread message tracking for badges.

```sql
-- Run this in Supabase SQL Editor
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
```

## How to Run Migrations

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the SQL from each migration file above
5. Click "Run" to execute

## After Running Migrations

Once you've run both migrations:
- ✅ Unread message badges will appear in the navbar
- ✅ Chat/claim separation will work correctly
- ✅ Conversations will show unread indicators in the sidebar
- ✅ All existing messages will be marked as unread (read=false)
