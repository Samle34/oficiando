-- ================================================================
-- Oficiando — Migration 005: bidirectional ratings
-- ================================================================
-- Adds worker → client rating flow:
--   • client_ratings table (worker rates client after job closes)
--   • client_rating / client_rating_count columns on profiles
--   • trigger auto-recalculates client rating average
-- ================================================================

-- ─── 1. client_ratings table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_ratings (
  id          bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id      bigint       NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id   uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score       smallint     NOT NULL,
  comment     text,
  created_at  timestamptz  NOT NULL DEFAULT now(),

  UNIQUE (job_id, worker_id)  -- one worker rates one client once per job
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname   = 'client_ratings_score_check'
    AND   conrelid  = 'public.client_ratings'::regclass
  ) THEN
    ALTER TABLE public.client_ratings
      ADD CONSTRAINT client_ratings_score_check
      CHECK (score >= 1 AND score <= 5);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS client_ratings_client_id_idx
  ON public.client_ratings (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS client_ratings_job_id_idx
  ON public.client_ratings (job_id);

-- ─── 2. RLS on client_ratings ────────────────────────────────────

ALTER TABLE public.client_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_ratings FORCE ROW LEVEL SECURITY;

-- Anyone can read client ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'client_ratings' AND policyname = 'client_ratings_select_public'
  ) THEN
    CREATE POLICY "client_ratings_select_public"
      ON public.client_ratings FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Only the worker who did the job can insert their rating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'client_ratings' AND policyname = 'client_ratings_insert_worker'
  ) THEN
    CREATE POLICY "client_ratings_insert_worker"
      ON public.client_ratings FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = worker_id);
  END IF;
END $$;

GRANT SELECT ON public.client_ratings TO anon;
GRANT SELECT, INSERT ON public.client_ratings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.client_ratings_id_seq TO authenticated;

-- ─── 3. Add client rating columns to profiles ─────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_rating       numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_rating_count integer      NOT NULL DEFAULT 0;

-- ─── 4. Trigger: auto-recalculate client rating ───────────────────

CREATE OR REPLACE FUNCTION public.update_client_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_client_id uuid;
BEGIN
  v_client_id := COALESCE(NEW.client_id, OLD.client_id);

  UPDATE public.profiles
  SET
    client_rating = COALESCE(
      (SELECT ROUND(AVG(score)::numeric, 2)
       FROM public.client_ratings
       WHERE client_id = v_client_id),
      0
    ),
    client_rating_count = (
      SELECT COUNT(*)
      FROM public.client_ratings
      WHERE client_id = v_client_id
    )
  WHERE id = v_client_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS client_ratings_update_client_rating ON public.client_ratings;
CREATE TRIGGER client_ratings_update_client_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.client_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_rating();
