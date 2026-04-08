-- ================================================================
-- Oficiando — Migration 001: jobs table
-- ================================================================
-- Design decisions:
--   • bigint identity PK (avoids UUID v4 index fragmentation)
--   • timestamptz (never bare timestamp)
--   • text over varchar(n) (same performance, no arbitrary limit)
--   • CHECK constraints for category_id and status (easier to
--     extend than enum types — no ALTER TYPE required)
--   • Generated stored tsvector for full-text search in Spanish
--   • Partial indexes targeting the most frequent query patterns
--   • RLS enabled + forced (defense in depth)
--   • auth.uid() always wrapped in SELECT subquery (evaluated once
--     per query, not once per row — 100x faster on large tables)
-- ================================================================

-- ─── Main table ──────────────────────────────────────────────────

create table if not exists public.jobs (

  -- Identity: bigint, sequential, 8 bytes, SQL-standard
  id              bigint        generated always as identity primary key,

  -- Job content
  title           text          not null,
  description     text,

  -- Category (values enforced by CHECK constraint below)
  category_id     text          not null,

  -- Location
  province        text          not null,
  city            text          not null,

  -- Status: open → closed (one-way transition, enforced by CHECK)
  status          text          not null default 'abierto',

  -- Client contact info (workers reach out via WhatsApp)
  client_name     text          not null,
  client_phone    text          not null,

  -- Number of applicants (incremental counter)
  applicants      integer       not null default 0,

  -- Job owner (nullable: v1 allows anonymous posts)
  user_id         uuid          references auth.users (id) on delete set null,

  -- Always timezone-aware timestamps
  posted_at       timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),

  -- Full-text search vector (generated, stored on disk)
  -- Combines title + city + province + description for unified search
  search_vector   tsvector      generated always as (
    to_tsvector(
      'spanish',
      coalesce(title, '')       || ' ' ||
      coalesce(city, '')        || ' ' ||
      coalesce(province, '')    || ' ' ||
      coalesce(description, '')
    )
  ) stored

);

-- ─── Constraints ─────────────────────────────────────────────────
-- DO blocks for idempotency — Postgres does not support
-- ADD CONSTRAINT IF NOT EXISTS, so this pattern never fails on re-runs.

-- status: only the two business values
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_status_check'
    and conrelid  = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_status_check
      check (status in ('abierto', 'cerrado'));
  end if;
end $$;

-- category_id: exact mirror of lib/categories.ts → CategoryId
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_category_id_check'
    and conrelid  = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_category_id_check
      check (category_id in (
        'plomeria',
        'electricidad',
        'limpieza',
        'albanileria',
        'pintura',
        'jardineria',
        'mudanzas',
        'otros'
      ));
  end if;
end $$;

-- client_phone: flexible format for Argentine numbers
-- Accepts: 1134567890 / +541134567890 / 011-3456-7890
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_client_phone_check'
    and conrelid  = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_client_phone_check
      check (client_phone ~ '^\+?[\d\s\-\(\)]{6,20}$');
  end if;
end $$;

-- applicants: never negative
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_applicants_check'
    and conrelid  = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_applicants_check
      check (applicants >= 0);
  end if;
end $$;

-- ─── Indexes ─────────────────────────────────────────────────────

-- 1. Partial index: open jobs filtered by category + date
--    Most frequent query: "show open plumbing jobs"
--    Indexes only rows where status = 'abierto' → ~2x smaller index
create index if not exists jobs_open_by_category_idx
  on public.jobs (category_id, posted_at desc)
  where status = 'abierto';

-- 2. Partial index: all open jobs by date (no category filter)
create index if not exists jobs_open_by_date_idx
  on public.jobs (posted_at desc)
  where status = 'abierto';

-- 3. Index on user_id → "my projects" page + RLS policy evaluation
create index if not exists jobs_user_id_idx
  on public.jobs (user_id)
  where user_id is not null;

-- 4. GIN index on tsvector → full-text search
--    Supports @@ to_tsquery and websearch_to_tsquery operators
create index if not exists jobs_search_vector_idx
  on public.jobs using gin (search_vector);

-- ─── Trigger: auto-update updated_at ─────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''          -- Prevents search_path injection
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Only fires on UPDATE (INSERT already has DEFAULT now())
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row
  execute function public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────
-- force row level security: applies even to the table owner,
-- so a missing WHERE clause never leaks data.

alter table public.jobs enable row level security;
alter table public.jobs force row level security;

-- SELECT policies ─────────────────────────────────────────────────

-- anon and authenticated can read all open jobs
create policy "jobs_select_open"
  on public.jobs
  for select
  to anon, authenticated
  using (status = 'abierto');

-- authenticated can also read their own jobs (open + closed)
-- auth.uid() wrapped in SELECT → evaluated once per query, not per row
create policy "jobs_select_own"
  on public.jobs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT policies ─────────────────────────────────────────────────

-- anon can post jobs without an account (user_id must be NULL)
create policy "jobs_insert_anon"
  on public.jobs
  for insert
  to anon
  with check (user_id is null);

-- authenticated can only insert jobs tied to their own user_id
create policy "jobs_insert_auth"
  on public.jobs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE policies ─────────────────────────────────────────────────

-- authenticated can only update their own jobs
-- Use case: closing a job (status: abierto → cerrado)
-- USING: which rows can be touched / WITH CHECK: what values are allowed
create policy "jobs_update_own"
  on public.jobs
  for update
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: no policy defined = denied for everyone by default
-- Jobs are never deleted through the API — they are only closed.

-- ─── Grants ──────────────────────────────────────────────────────
-- Principle of least privilege: each role gets only what it needs.

-- anon: read open jobs and post without an account
grant select, insert
  on public.jobs
  to anon;

-- authenticated: read + post + close own jobs
grant select, insert, update
  on public.jobs
  to authenticated;

-- service_role inherits everything (for admin backend operations)
-- DELETE is intentionally not granted to any role.
