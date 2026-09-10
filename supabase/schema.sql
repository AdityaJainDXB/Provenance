-- =====================================================================
-- PROVENANCE — database schema + Row Level Security
-- Run this once in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: every statement is guarded.
-- =====================================================================

-- ---------- enums ----------------------------------------------------
do $$ begin
  create type user_role as enum ('consumer', 'admin');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------------------------------------------------
-- One row per auth user. `role` gates the admin panel.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         user_role   not null default 'consumer',
  display_name text,
  avatar_url   text,
  onboarded    boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- ---------- style_preferences ----------------------------------------
-- Captured during onboarding. The strongest ranking signal.
create table if not exists public.style_preferences (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  crafts     text[]      not null default '{}',
  aesthetics text[]      not null default '{}',
  regions    text[]      not null default '{}',
  price_max  integer,
  pace       text,                       -- 'calm' | 'energetic'
  updated_at timestamptz not null default now()
);

-- ---------- admin_access_codes -------------------------------------
-- Codes an admin types on the sign-in page. Only ever read by the
-- `redeem-admin-code` Edge Function (service role). Never client-readable.
create table if not exists public.admin_access_codes (
  id         uuid primary key default gen_random_uuid(),
  label      text,
  code_hash  text        not null,       -- sha-256 hex of the plain code
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

-- ---------- videos --------------------------------------------------
create table if not exists public.videos (
  id               uuid primary key default gen_random_uuid(),
  uploader_id      uuid        not null references public.profiles (id) on delete cascade,
  maker_name       text        not null,
  title            text        not null,
  technique        text,
  region           text,
  price            text,
  craft_tag        text,
  style_tags       text[]      not null default '{}',
  storage_path     text        not null,   -- object key in the `videos` bucket
  poster_path      text,                   -- object key in the `posters` bucket
  duration_seconds integer,
  status           text        not null default 'published'
                   check (status in ('draft', 'published', 'archived')),
  created_at       timestamptz not null default now()
);
create index if not exists videos_status_created_idx on public.videos (status, created_at desc);

-- ---------- video_events ------------------------------------------
-- Every view / like / save / share / skip / complete. Feeds ranking.
-- Individual rows are private (no select policy) — consistent with the
-- platform's "no public vanity metrics" stance. Aggregates come from
-- the view below.
create table if not exists public.video_events (
  id         bigint generated always as identity primary key,
  user_id    uuid        references public.profiles (id) on delete set null,
  video_id   uuid        not null references public.videos (id) on delete cascade,
  type       text        not null
             check (type in ('view','like','unlike','save','unsave','share','skip','complete')),
  watch_ms   integer,
  created_at timestamptz not null default now()
);
create index if not exists video_events_video_idx on public.video_events (video_id);
create index if not exists video_events_user_idx  on public.video_events (user_id, type);

-- ---------- aggregate view --------------------------------------------
create or replace view public.video_stats as
select
  v.id as video_id,
  count(*) filter (where e.type = 'view')                        as views,
  count(*) filter (where e.type = 'like')
    - count(*) filter (where e.type = 'unlike')                  as likes,
  count(*) filter (where e.type = 'save')
    - count(*) filter (where e.type = 'unsave')                  as saves,
  count(*) filter (where e.type = 'share')                       as shares
from public.videos v
left join public.video_events e on e.video_id = v.id
group by v.id;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles           enable row level security;
alter table public.style_preferences  enable row level security;
alter table public.admin_access_codes enable row level security;
alter table public.videos             enable row level security;
alter table public.video_events       enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: a user sees and edits only their own row. `role` is NOT
-- writable from the client — it is only ever set by the
-- `redeem-admin-code` function (service role bypasses RLS).
drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert with check (auth.uid() = id and role = 'consumer');

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- style_preferences: fully private to the owner.
drop policy if exists "prefs owner all" on public.style_preferences;
create policy "prefs owner all" on public.style_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- admin_access_codes: no client access at all.
drop policy if exists "codes no access" on public.admin_access_codes;
create policy "codes no access" on public.admin_access_codes
  for select using (false);

-- videos: anyone signed in can read published rows; an uploader can see
-- their own drafts. Only admins write.
drop policy if exists "videos read" on public.videos;
create policy "videos read" on public.videos
  for select using (status = 'published' or uploader_id = auth.uid());

drop policy if exists "videos admin insert" on public.videos;
create policy "videos admin insert" on public.videos
  for insert with check (public.is_admin() and uploader_id = auth.uid());

drop policy if exists "videos admin update" on public.videos;
create policy "videos admin update" on public.videos
  for update using (public.is_admin());

drop policy if exists "videos admin delete" on public.videos;
create policy "videos admin delete" on public.videos
  for delete using (public.is_admin());

-- video_events: a user can write their own events. No one reads raw
-- events from the client (ranking + admin stats use the service role
-- and the aggregate view).
drop policy if exists "events insert own" on public.video_events;
create policy "events insert own" on public.video_events
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "events read own engagement" on public.video_events;
create policy "events read own engagement" on public.video_events
  for select using (auth.uid() = user_id);

-- =====================================================================
-- Storage bucket policies
-- Create the buckets first (see supabase/README.md), then run this.
-- =====================================================================
-- Public read for both buckets:
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id in ('videos', 'posters'));

-- Only admins upload / replace / delete media:
drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects
  for insert with check (bucket_id in ('videos', 'posters') and public.is_admin());

drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update using (bucket_id in ('videos', 'posters') and public.is_admin());

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete using (bucket_id in ('videos', 'posters') and public.is_admin());

-- =====================================================================
-- Auto-create a profile row the moment a user signs up
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
