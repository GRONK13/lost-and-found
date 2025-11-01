# 🚀 Quick Setup Instructions

Follow these steps to enable all new features:

## Step 1: Run Database Migrations

### Option A: Run Both Migrations Together
```sql
-- Add campus column to items table
ALTER TABLE items ADD COLUMN campus TEXT CHECK (campus IN ('TC', 'MC'));
CREATE INDEX idx_items_campus ON items(campus);

-- Add messages table for chat
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  claim_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_claim_id ON messages(claim_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

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
```

### Option B: Run Individual Migration Files
1. Open Supabase → SQL Editor
2. Run `db/migration_add_campus.sql`
3. Run `db/migration_add_messages.sql`

## Step 2: Set Up Storage Bucket

1. Go to Supabase → Storage
2. Click "Create a new bucket"
3. Name: `item-photos`
4. **Make it public** ✓
5. Click "Create bucket"

### Add Storage Policies

Run this in SQL Editor:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-photos');

-- Allow public to read
CREATE POLICY "Public can read photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 3: Install Dependencies (if not done)

```bash
npm install
```

This includes the new `next-themes` package.

## Step 4: Test Everything

### Test Dark Mode
- Look for sun/moon icon in navbar
- Click it and select a theme
- Page should update instantly

### Test Photo Upload
1. Sign in
2. Go to `/report`
3. Fill form and upload a photo (max 5MB)
4. Submit
5. Check if photo shows in items list

### Test Campus Filter
1. Report items with TC and MC campuses
2. Go to `/items`
3. Use campus dropdown to filter
4. Verify filtering works

### Test Notifications
1. User A reports an item
2. User B claims it
3. User A should see red badge on "My Claims" with count

### Test Chat
1. User B claims an item
2. User B sees chat box on item detail page
3. Send a message
4. User A (reporter) sees message in real-time
5. Reply should appear instantly for User B

## 🐛 Troubleshooting

### Photos not uploading?
- Check bucket exists and is named `item-photos`
- Verify bucket is **public**
- Check storage policies are applied
- Look for console errors (F12)

### Chat not working?
- Verify `messages` table exists
- Check RLS policies are enabled
- Make sure Supabase Realtime is enabled for `messages` table

### Dark mode not persisting?
- Clear browser cache
- Check if cookies are enabled

### Campus filter not working?
- Run the campus migration
- Refresh the page
- Check existing items have campus values

## ✅ Verification Checklist

- [ ] Campus column added to items table
- [ ] Messages table created with RLS policies
- [ ] Storage bucket `item-photos` created and public
- [ ] Storage policies added
- [ ] Dependencies installed
- [ ] Dark mode toggle visible in navbar
- [ ] Photo upload works on report page
- [ ] Campus dropdown visible in report form
- [ ] Campus filter visible in items page
- [ ] Notification badge appears for pending claims
- [ ] Chat boxes appear on item detail pages

## 🎉 You're Done!

All features should now be working. Check `NEW-FEATURES.md` for detailed documentation.
