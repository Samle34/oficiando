-- ================================================================
-- Oficiando — Migration 004: applications.status + message + job-owner policies
-- ================================================================
-- Reconstructed from the live production schema. This migration was
-- originally applied through the Supabase dashboard and never versioned
-- in this repository. Committing it here so that a fresh environment
-- can be rebuilt from migrations alone.
--
-- Adds:
--   • applications.status  — 'pending' by default, 'accepted' after the
--     client accepts the worker's application
--   • applications.message — optional greeting the worker writes when
--     applying; reused as the opening WhatsApp message if accepted
--   • is_job_owner(bigint) — SECURITY DEFINER helper used by RLS so
--     policies can ask "does this job belong to me?" without forcing
--     every consumer to duplicate a join
--   • applications_select_job_owner / applications_update_job_owner —
--     lets the job owner read all applications for their own job and
--     flip status to 'accepted'
-- ================================================================

-- ─── 1. Columns on applications ──────────────────────────────────

alter table public.applications
  add column if not exists status  text not null default 'pending',
  add column if not exists message text;

-- ─── 2. is_job_owner helper ──────────────────────────────────────
-- SECURITY DEFINER so the function can read jobs even when the
-- caller's RLS would otherwise hide rows. Bound to auth.uid() so
-- it's still safe: it only returns true for rows the caller owns.

create or replace function public.is_job_owner(p_job_id bigint)
returns boolean
language sql
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from public.jobs
    where id = p_job_id and user_id = auth.uid()
  );
$$;

-- ─── 3. RLS policies for job owners ──────────────────────────────
-- Both are scoped to the `public` role grant chain; auth.uid() inside
-- is_job_owner restricts effectively to authenticated users.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and   tablename  = 'applications'
    and   policyname = 'applications_select_job_owner'
  ) then
    create policy "applications_select_job_owner"
      on public.applications
      for select
      using (public.is_job_owner(job_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and   tablename  = 'applications'
    and   policyname = 'applications_update_job_owner'
  ) then
    create policy "applications_update_job_owner"
      on public.applications
      for update
      using (public.is_job_owner(job_id));
  end if;
end $$;
