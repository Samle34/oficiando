-- ================================================================
-- Oficiando — Migration 002: roles, photos, portfolio, ratings
-- ================================================================
-- Design decisions:
--   • ALTER TABLE with IF NOT EXISTS for idempotency
--   • DO blocks for CHECK constraints (no ADD CONSTRAINT IF NOT EXISTS)
--   • photos stored as text[] URLs (files live in Supabase Storage)
--   • Trigger auto-recalculates rating average on profiles
--   • Storage buckets created via SQL (not dashboard)
--   • RLS enabled + forced on all new tables
--   • auth.uid() wrapped in SELECT subquery for performance
-- ================================================================

-- ─── 1. Extend profiles ──────────────────────────────────────────

alter table public.profiles
  add column if not exists role          text          not null default 'client',
  add column if not exists avatar_url    text,
  add column if not exists bio           text,
  add column if not exists categories    text[]        not null default '{}',
  add column if not exists work_zones    text[]        not null default '{}',
  add column if not exists rating        numeric(3,2)  not null default 0,
  add column if not exists rating_count  integer       not null default 0;

-- role: 'client' | 'worker'
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname    = 'profiles_role_check'
    and   conrelid   = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('client', 'worker'));
  end if;
end $$;

-- rating: 0.00 – 5.00
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname    = 'profiles_rating_check'
    and   conrelid   = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_rating_check
      check (rating >= 0 and rating <= 5);
  end if;
end $$;

-- ─── 2. RLS on profiles (was missing) ────────────────────────────

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Anyone can read profiles (needed for /trabajador/[id] public page)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and   tablename  = 'profiles'
    and   policyname = 'profiles_select_public'
  ) then
    create policy "profiles_select_public"
      on public.profiles
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- Only the user can insert their own profile row
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and   tablename  = 'profiles'
    and   policyname = 'profiles_insert_own'
  ) then
    create policy "profiles_insert_own"
      on public.profiles
      for insert
      to authenticated
      with check ((select auth.uid()) = id);
  end if;
end $$;

-- Only the user can update their own profile row
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and   tablename  = 'profiles'
    and   policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own"
      on public.profiles
      for update
      to authenticated
      using  ((select auth.uid()) = id)
      with check ((select auth.uid()) = id);
  end if;
end $$;

grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;

-- ─── 3. Add photos to jobs ────────────────────────────────────────

alter table public.jobs
  add column if not exists photos text[] not null default '{}';

-- max 3 photos per job
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname    = 'jobs_photos_max_check'
    and   conrelid   = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_photos_max_check
      check (array_length(photos, 1) is null or array_length(photos, 1) <= 3);
  end if;
end $$;

-- ─── 4. portfolio_items ───────────────────────────────────────────

create table if not exists public.portfolio_items (
  id          bigint        generated always as identity primary key,
  worker_id   uuid          not null references auth.users (id) on delete cascade,
  title       text          not null,
  description text,
  photos      text[]        not null default '{}',
  created_at  timestamptz   not null default now()
);

-- max 3 photos per portfolio item
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname    = 'portfolio_photos_max_check'
    and   conrelid   = 'public.portfolio_items'::regclass
  ) then
    alter table public.portfolio_items
      add constraint portfolio_photos_max_check
      check (array_length(photos, 1) is null or array_length(photos, 1) <= 3);
  end if;
end $$;

create index if not exists portfolio_worker_id_idx
  on public.portfolio_items (worker_id, created_at desc);

alter table public.portfolio_items enable row level security;
alter table public.portfolio_items force row level security;

create policy "portfolio_select_public"
  on public.portfolio_items
  for select
  to anon, authenticated
  using (true);

create policy "portfolio_insert_own"
  on public.portfolio_items
  for insert
  to authenticated
  with check ((select auth.uid()) = worker_id);

create policy "portfolio_update_own"
  on public.portfolio_items
  for update
  to authenticated
  using  ((select auth.uid()) = worker_id)
  with check ((select auth.uid()) = worker_id);

create policy "portfolio_delete_own"
  on public.portfolio_items
  for delete
  to authenticated
  using ((select auth.uid()) = worker_id);

grant select on public.portfolio_items to anon;
grant select, insert, update, delete on public.portfolio_items to authenticated;
grant usage, select on sequence public.portfolio_items_id_seq to authenticated;

-- ─── 5. ratings ──────────────────────────────────────────────────

create table if not exists public.ratings (
  id          bigint        generated always as identity primary key,
  job_id      bigint        not null references public.jobs (id) on delete cascade,
  worker_id   uuid          not null references auth.users (id) on delete cascade,
  client_id   uuid          not null references auth.users (id) on delete cascade,
  score       smallint      not null,
  comment     text,
  created_at  timestamptz   not null default now(),

  unique (job_id, worker_id)   -- one rating per job+worker pair
);

-- score: 1 – 5
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname    = 'ratings_score_check'
    and   conrelid   = 'public.ratings'::regclass
  ) then
    alter table public.ratings
      add constraint ratings_score_check
      check (score >= 1 and score <= 5);
  end if;
end $$;

create index if not exists ratings_worker_id_idx
  on public.ratings (worker_id, created_at desc);

create index if not exists ratings_job_id_idx
  on public.ratings (job_id);

alter table public.ratings enable row level security;
alter table public.ratings force row level security;

create policy "ratings_select_public"
  on public.ratings
  for select
  to anon, authenticated
  using (true);

-- Only the client of the job can insert a rating
create policy "ratings_insert_client"
  on public.ratings
  for insert
  to authenticated
  with check ((select auth.uid()) = client_id);

grant select on public.ratings to anon;
grant select, insert on public.ratings to authenticated;
grant usage, select on sequence public.ratings_id_seq to authenticated;

-- ─── 6. Trigger: auto-recalculate worker rating ──────────────────

create or replace function public.update_worker_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_worker_id uuid;
begin
  v_worker_id := coalesce(new.worker_id, old.worker_id);

  update public.profiles
  set
    rating = coalesce(
      (select round(avg(score)::numeric, 2)
       from public.ratings
       where worker_id = v_worker_id),
      0
    ),
    rating_count = (
      select count(*)
      from public.ratings
      where worker_id = v_worker_id
    )
  where id = v_worker_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists ratings_update_worker_rating on public.ratings;
create trigger ratings_update_worker_rating
  after insert or update or delete on public.ratings
  for each row
  execute function public.update_worker_rating();

-- ─── 7. Storage buckets ───────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars', 'avatars', true,
    2097152,  -- 2 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'job-photos', 'job-photos', true,
    5242880,  -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'portfolio', 'portfolio', true,
    5242880,  -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- ─── 8. Storage RLS policies ──────────────────────────────────────

-- avatars: public read, own-folder write
create policy "avatars_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- job-photos: public read, any authenticated can upload
-- (server action validates ownership before saving URL to DB)
create policy "job_photos_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'job-photos');

create policy "job_photos_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "job_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- portfolio: public read, own-folder write/delete
create policy "portfolio_photos_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio');

create policy "portfolio_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "portfolio_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
