-- Add campus column to items table
ALTER TABLE items ADD COLUMN campus TEXT CHECK (campus IN ('TC', 'MC'));

-- Add index for campus filtering
CREATE INDEX idx_items_campus ON items(campus);
