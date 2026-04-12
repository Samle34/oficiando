-- ================================================================
-- Oficiando — Migration 006: harden ratings / client_ratings RLS
-- ================================================================
-- Defense in depth. The existing policies only checked that the
-- inserter was authenticated and matched one side of the row:
--
--   ratings_insert_client:        with_check (auth.uid() = client_id)
--   client_ratings_insert_worker: with_check (auth.uid() = worker_id)
--
-- This lets any authenticated client insert a rating for any worker
-- of any closed job, and any worker insert a client_rating against
-- any user, bypassing the server-action ownership checks.
--
-- This migration replaces both with policies that mirror the
-- server-action business rules:
--
--   ratings: only the job owner can rate, the job must be closed,
--     and the worker must have an accepted application on that job
--
--   client_ratings: only the worker can rate, the job must be closed,
--     the worker must have an accepted application, and the target
--     client_id must equal jobs.user_id
-- ================================================================

-- ─── 1. ratings ──────────────────────────────────────────────────

drop policy if exists "ratings_insert_client" on public.ratings;

create policy "ratings_insert_client"
  on public.ratings
  for insert
  to authenticated
  with check (
    (select auth.uid()) = client_id
    and exists (
      select 1
      from public.jobs j
      where j.id      = ratings.job_id
        and j.user_id = (select auth.uid())
        and j.status  = 'cerrado'
    )
    and exists (
      select 1
      from public.applications a
      where a.job_id    = ratings.job_id
        and a.worker_id = ratings.worker_id
        and a.status    = 'accepted'
    )
  );

-- ─── 2. client_ratings ───────────────────────────────────────────

drop policy if exists "client_ratings_insert_worker" on public.client_ratings;

create policy "client_ratings_insert_worker"
  on public.client_ratings
  for insert
  to authenticated
  with check (
    (select auth.uid()) = worker_id
    and exists (
      select 1
      from public.jobs j
      where j.id      = client_ratings.job_id
        and j.user_id = client_ratings.client_id
        and j.status  = 'cerrado'
    )
    and exists (
      select 1
      from public.applications a
      where a.job_id    = client_ratings.job_id
        and a.worker_id = (select auth.uid())
        and a.status    = 'accepted'
    )
  );
