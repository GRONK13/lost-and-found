-- Add chat_type column to claims table to distinguish between chat requests and claim requests
ALTER TABLE claims ADD COLUMN chat_type TEXT DEFAULT 'claim' CHECK (chat_type IN ('claim', 'chat'));

-- Update existing records: if message contains "would like to discuss", mark as chat
UPDATE claims 
SET chat_type = 'chat' 
WHERE message LIKE '%would like to discuss%';

-- Create index for better performance
CREATE INDEX idx_claims_chat_type ON claims(chat_type);

-- Update RLS policies if needed (existing policies should still work)
