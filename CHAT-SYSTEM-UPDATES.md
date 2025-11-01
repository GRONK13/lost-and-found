# Chat System Updates

## Summary
This update separates chat requests from claim requests, personalizes chat messages, simplifies the item return process, and fixes the bug where accepting a chat request would incorrectly mark items as claimed.

## Changes Made

### 1. Database Migration - Chat Type Separation
**File**: `db/migration_add_chat_type.sql`

Added a new `chat_type` column to the `claims` table to distinguish between:
- `'chat'` - Chat-only requests (for discussions)
- `'claim'` - Actual claim requests (for claiming lost items)

**Migration steps**:
```sql
ALTER TABLE claims ADD COLUMN chat_type TEXT DEFAULT 'claim' CHECK (chat_type IN ('claim', 'chat'));
UPDATE claims SET chat_type = 'chat' WHERE message LIKE '%would like to discuss%';
CREATE INDEX idx_claims_chat_type ON claims(chat_type);
```

### 2. TypeScript Types Update
**File**: `lib/database.types.ts`

Added `chat_type: 'claim' | 'chat'` to the claims table interfaces.

### 3. Chat Initialization - Personalized Messages
**File**: `components/ChatWithReporterButton.tsx`

**Changes**:
- Now fetches the current user's name from the database
- Creates chat requests with personalized message: `"<UserName> would like to discuss this item with you."`
- Sets `chat_type: 'chat'` when creating a new chat request
- Chat requests are now separate from claim requests

**Before**: "I would like to discuss this item with you."
**After**: "John Doe would like to discuss this item with you."

### 4. Chats Page - Filter by Chat Type
**File**: `app/chats/page.tsx`

**Changes**:
- Now only shows claims where `chat_type = 'chat'`
- Chat requests appear in `/chats` page
- Wrapped in Suspense boundary for proper Next.js static generation
- Auto-selects chat from URL parameter on page load

### 5. Claims Page - Filter by Claim Type
**File**: `app/claims/page.tsx`

**Changes**:
- Now only shows claims where `chat_type = 'claim'`
- Regular claim requests appear in `/claims` page
- Chat requests do NOT appear in My Claims anymore

### 6. Update Item Status - Simplified to Direct Return
**File**: `components/UpdateItemStatusButton.tsx`

**Changes**:
- Removed the two-step process (Mark as Found → Mark as Returned)
- Now always shows "Mark as Returned" for both `lost` and `found` items
- Directly changes status to `'returned'` in one click
- Simplified user experience

**Before**: 
- Lost → Found (button: "Mark as Found")
- Found → Returned (button: "Mark as Returned")

**After**:
- Lost/Found → Returned (button: "Mark as Returned")

### 7. Claim Approval API - Chat vs Claim Logic
**File**: `app/api/claims/update/route.ts`

**Changes**:
- Fixed critical bug where accepting ANY claim would change item status
- Now only updates item status to `'claimed'` when:
  - Status is `'approved'` AND
  - `chat_type = 'claim'` (not 'chat')
- Chat requests can be approved without affecting item status

**Before**: Accepting a chat request → Item marked as "claimed" ❌
**After**: Accepting a chat request → Item status unchanged ✅

### 8. Navbar - Separate Notifications
**File**: `components/Navbar.tsx`

**Changes**:
- **My Claims badge**: Only counts pending **claim-type** requests
- **Chats badge**: Only counts unread messages in **chat-type** conversations
- Proper separation of notification types

## User Flow Changes

### Chat Request Flow (NEW)
1. User clicks "Chat with Reporter" on lost item
2. Creates a chat request (`chat_type = 'chat'`) with personalized message
3. Chat request appears in `/chats` page (not in My Claims)
4. Reporter can accept/reject chat request
5. Accepting chat enables messaging WITHOUT changing item status
6. Item remains available for others to claim

### Claim Request Flow (UNCHANGED)
1. User submits a claim through proper claim form
2. Creates a claim request (`chat_type = 'claim'`)
3. Claim appears in `/claims` page
4. Reporter approves/rejects claim
5. Approving claim changes item status to `'claimed'`
6. Item is no longer available for others

## Testing Checklist

Before deploying, test the following:

### Database Migration
- [ ] Run `migration_add_chat_type.sql` in Supabase SQL Editor
- [ ] Verify `chat_type` column exists with default 'claim'
- [ ] Verify existing chat messages are marked as `chat_type = 'chat'`

### Chat Functionality
- [ ] Click "Chat with Reporter" on an item
- [ ] Verify message shows user's name (not "I would like to discuss")
- [ ] Verify chat appears in `/chats` (not in `/claims`)
- [ ] Accept chat request
- [ ] Verify item status is NOT changed to "claimed"
- [ ] Verify messaging works normally

### Claims Functionality
- [ ] Submit a proper claim request
- [ ] Verify claim appears in `/claims` (not in `/chats`)
- [ ] Approve claim
- [ ] Verify item status changes to "claimed"

### Mark as Returned
- [ ] As reporter, find a lost or found item
- [ ] Click "Mark as Returned"
- [ ] Verify item status changes directly to "returned"
- [ ] Verify button text is always "Mark as Returned"

### Notifications
- [ ] Verify pending claims badge only shows claim-type requests
- [ ] Verify chats badge only shows unread chat messages
- [ ] Test real-time updates for both badges

## Migration Instructions

1. **Run Database Migration First**:
   - Go to Supabase Dashboard → SQL Editor
   - Run `db/migration_add_chat_type.sql`
   - Verify no errors

2. **Deploy Code Changes**:
   - All code changes are backward compatible
   - Existing claims will default to `chat_type = 'claim'`
   - Existing chats will be migrated to `chat_type = 'chat'`

3. **Verify After Deployment**:
   - Test chat creation
   - Test claim creation
   - Test chat acceptance (should NOT change item status)
   - Test claim approval (should change item status)
   - Test "Mark as Returned" button

## Breaking Changes
None - fully backward compatible with existing data.

## Notes
- Chat requests and claim requests are now completely separate systems
- This prevents confusion between "chatting about an item" vs "claiming an item"
- Users can discuss items without committing to claiming them
- Reporters can communicate without changing item availability
