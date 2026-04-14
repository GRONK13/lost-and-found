-- Require photos for new item reports without modifying existing photo-less records.
-- This only enforces on INSERT; existing rows remain valid.

CREATE OR REPLACE FUNCTION public.enforce_item_photo_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.photo_url IS NULL OR btrim(NEW.photo_url) = '' THEN
    RAISE EXCEPTION 'Photo is required for new item reports';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_item_photo_on_insert ON public.items;

CREATE TRIGGER trg_enforce_item_photo_on_insert
BEFORE INSERT ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_item_photo_on_insert();
