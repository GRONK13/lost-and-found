-- Lost & Found Portal Row-Level Security Policies
-- Run this after schema.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- USERS TABLE POLICIES
-- ===========================

-- Users can view their own profile and admins can view all
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- New users can insert their own record (handled by trigger)
CREATE POLICY "Users can insert own record"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ===========================
-- ITEMS TABLE POLICIES
-- ===========================

-- Select: all can see non-hidden items, admins see all, reporters see their own
CREATE POLICY "Items are viewable by everyone (non-hidden)"
  ON public.items FOR SELECT
  USING (
    hidden = FALSE 
    OR is_admin() 
    OR reporter_id = auth.uid()
  );

-- Insert: authenticated users can create items
CREATE POLICY "Authenticated users can create items"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Update: reporters can update their own items
CREATE POLICY "Reporters can update own items"
  ON public.items FOR UPDATE
  USING (reporter_id = auth.uid())
  WITH CHECK (reporter_id = auth.uid());

-- Update: admins can update any item (for hiding/moderating)
CREATE POLICY "Admins can update any item"
  ON public.items FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Delete: reporters can delete their own items if not claimed
CREATE POLICY "Reporters can delete own unclaimed items"
  ON public.items FOR DELETE
  USING (
    reporter_id = auth.uid() 
    AND status NOT IN ('claimed', 'returned')
  );

-- Delete: admins can delete any item
CREATE POLICY "Admins can delete any item"
  ON public.items FOR DELETE
  USING (is_admin());

-- ===========================
-- CLAIMS TABLE POLICIES
-- ===========================

-- Select: claimants see their own claims, reporters see claims on their items
CREATE POLICY "Users can view relevant claims"
  ON public.claims FOR SELECT
  USING (
    claimant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = claims.item_id
      AND items.reporter_id = auth.uid()
    )
  );

-- Insert: authenticated users can create claims (one per item)
CREATE POLICY "Authenticated users can create claims"
  ON public.claims FOR INSERT
  TO authenticated
  WITH CHECK (claimant_id = auth.uid());

-- Update: reporters of the item can update claims (approve/reject)
CREATE POLICY "Item reporters can update claims"
  ON public.claims FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = claims.item_id
      AND items.reporter_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = claims.item_id
      AND items.reporter_id = auth.uid()
    )
  );

-- Delete: claimants or reporters can delete pending claims
CREATE POLICY "Users can delete pending claims"
  ON public.claims FOR DELETE
  USING (
    status = 'pending'
    AND (
      claimant_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.items
        WHERE items.id = claims.item_id
        AND items.reporter_id = auth.uid()
      )
    )
  );

-- ===========================
-- FLAGS TABLE POLICIES
-- ===========================

-- Insert: any authenticated user can flag an item
CREATE POLICY "Authenticated users can flag items"
  ON public.flags FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Select: only admins can view flags
CREATE POLICY "Admins can view flags"
  ON public.flags FOR SELECT
  USING (is_admin());

-- Delete: only admins can delete flags
CREATE POLICY "Admins can delete flags"
  ON public.flags FOR DELETE
  USING (is_admin());
