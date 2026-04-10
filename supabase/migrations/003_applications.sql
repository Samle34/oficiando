-- ================================================================
-- Oficiando — Migration 003: applications table
-- Tracks when a worker presses "Quiero este trabajo" on a job.
-- This powers the worker's "Mis trabajos" history page.
-- ================================================================

-- ─── applications ────────────────────────────────────────────────

create table if not exists public.applications (
  id          bigint      generated always as identity primary key,
  job_id      bigint      not null references public.jobs(id) on delete cascade,
  worker_id   uuid        not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (job_id, worker_id)
);

-- Index: all applications by a given worker, newest first
create index if not exists applications_worker_id_idx
  on public.applications (worker_id, created_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────

alter table public.applications enable row level security;
alter table public.applications force row level security;

-- Workers can read their own applications
create policy "applications_select_own"
  on public.applications for select to authenticated
  using ((select auth.uid()) = worker_id);

-- Workers can insert their own applications
create policy "applications_insert_own"
  on public.applications for insert to authenticated
  with check ((select auth.uid()) = worker_id);

-- Workers can delete (withdraw) their own applications
create policy "applications_delete_own"
  on public.applications for delete to authenticated
  using ((select auth.uid()) = worker_id);

-- ─── Grants ──────────────────────────────────────────────────────

grant select, insert, delete on public.applications to authenticated;
grant usage, select on sequence public.applications_id_seq to authenticated;

-- ─── Trigger: keep jobs.applicants in sync ────────────────────────

create or replace function public.increment_job_applicants()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.jobs
    set applicants = applicants + 1
  where id = new.job_id;
  return new;
end;
$$;

drop trigger if exists applications_increment on public.applications;
create trigger applications_increment
  after insert on public.applications
  for each row execute function public.increment_job_applicants();

create or replace function public.decrement_job_applicants()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.jobs
    set applicants = greatest(applicants - 1, 0)
  where id = old.job_id;
  return old;
end;
$$;

drop trigger if exists applications_decrement on public.applications;
create trigger applications_decrement
  after delete on public.applications
  for each row execute function public.decrement_job_applicants();

-- ─── Allow workers to read jobs they applied to (even if closed) ──
-- Without this policy, jobs_select_open only shows open jobs,
-- so closed jobs a worker applied to would be invisible.

create policy "jobs_select_applied"
  on public.jobs for select to authenticated
  using (
    exists (
      select 1 from public.applications
      where applications.job_id  = jobs.id
        and applications.worker_id = (select auth.uid())
    )
  );
