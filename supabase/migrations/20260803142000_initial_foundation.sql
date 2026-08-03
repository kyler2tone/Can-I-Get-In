-- Can I Get In? Phase 1 foundation
-- Apply with Supabase CLI or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

create type public.profile_role as enum ('contributor', 'moderator', 'admin');
create type public.city_status as enum ('planned', 'phase_1_mapping', 'active', 'paused');
create type public.entry_outcome as enum (
  'likely_independent',
  'may_require_assistance',
  'visible_barrier',
  'insufficient_information'
);
create type public.publish_status as enum ('draft', 'pending_review', 'published', 'hidden');
create type public.photo_category as enum (
  'entrance_overview',
  'doorway_closeup',
  'parking',
  'route_to_entrance',
  'interior',
  'restroom',
  'seating',
  'checkout',
  'other'
);
create type public.moderation_status as enum ('pending', 'approved', 'hidden', 'rejected');
create type public.ai_analysis_status as enum ('not_started', 'pending', 'draft_ready', 'reviewed', 'failed');
create type public.observation_source as enum ('contributor', 'ai_draft', 'moderator');
create type public.verification_vote as enum ('agree', 'disagree', 'flag');
create type public.contribution_type as enum (
  'profile_created',
  'place_added',
  'photo_uploaded',
  'report_submitted',
  'report_verified',
  'missing_information_added'
);
create type public.flag_reason as enum (
  'inaccurate',
  'outdated',
  'unsafe',
  'abusive',
  'inappropriate',
  'privacy',
  'other'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'New Contributor',
  username text not null,
  avatar_url text,
  bio text,
  city text,
  state text,
  role public.profile_role not null default 'contributor',
  points integer not null default 0 check (points >= 0),
  contribution_count integer not null default 0 check (contribution_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,32}$')
);

create unique index profiles_username_unique on public.profiles (lower(username));

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text not null unique,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  status public.city_status not null default 'planned',
  boundary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  name text not null,
  slug text not null unique,
  address text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  category text,
  source text not null default 'community',
  external_source_id text,
  current_entry_status public.entry_outcome not null default 'insufficient_information',
  current_summary text,
  community_confidence numeric(3,2) not null default 0 check (community_confidence >= 0 and community_confidence <= 1),
  publish_status public.publish_status not null default 'draft',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_city_id_idx on public.places(city_id);
create index places_status_idx on public.places(publish_status, current_entry_status);

create table public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  category public.photo_category not null default 'other',
  moderation_status public.moderation_status not null default 'pending',
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_photos_user_path check (
    storage_path ~ ('^place-photos/[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$')
  )
);

create index place_photos_place_idx on public.place_photos(place_id);
create index place_photos_uploader_idx on public.place_photos(uploader_id);

create table public.accessibility_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  contributor_id uuid not null references public.profiles(id) on delete cascade,
  status public.publish_status not null default 'pending_review',
  summary text,
  entry_outcome public.entry_outcome not null default 'insufficient_information',
  contributor_notes text,
  ai_analysis_status public.ai_analysis_status not null default 'not_started',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accessibility_reports_place_idx on public.accessibility_reports(place_id, status);
create index accessibility_reports_contributor_idx on public.accessibility_reports(contributor_id);

create table public.report_observations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.accessibility_reports(id) on delete cascade,
  observation_type text not null,
  value text not null,
  unit text,
  confidence numeric(3,2) not null default 0.5 check (confidence >= 0 and confidence <= 1),
  source public.observation_source not null default 'contributor',
  contributor_confirmed boolean not null default false,
  uncertainty_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index report_observations_report_idx on public.report_observations(report_id);

create table public.report_verifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.accessibility_reports(id) on delete cascade,
  contributor_id uuid not null references public.profiles(id) on delete cascade,
  vote public.verification_vote not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(report_id, contributor_id)
);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references public.profiles(id) on delete cascade,
  contribution_type public.contribution_type not null,
  place_id uuid references public.places(id) on delete set null,
  report_id uuid references public.accessibility_reports(id) on delete set null,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index contributions_contributor_idx on public.contributions(contributor_id, created_at desc);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  rule_description text not null,
  points_value integer not null default 0 check (points_value >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_by uuid references public.profiles(id) on delete set null,
  awarded_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

create table public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  place_id uuid references public.places(id) on delete cascade,
  report_id uuid references public.accessibility_reports(id) on delete cascade,
  photo_id uuid references public.place_photos(id) on delete cascade,
  reason public.flag_reason not null,
  details text,
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  constraint moderation_flags_target check (
    place_id is not null or report_id is not null or photo_id is not null
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger cities_set_updated_at before update on public.cities
for each row execute function public.set_updated_at();
create trigger places_set_updated_at before update on public.places
for each row execute function public.set_updated_at();
create trigger place_photos_set_updated_at before update on public.place_photos
for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.accessibility_reports
for each row execute function public.set_updated_at();
create trigger observations_set_updated_at before update on public.report_observations
for each row execute function public.set_updated_at();

create or replace function public.username_from_email(email text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(split_part(coalesce(email, 'contributor'), '@', 1), '[^a-zA-Z0-9_]', '_', 'g'));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := left(greatest(public.username_from_email(new.email), 'user'), 24);
  if length(base_username) < 3 then
    base_username := 'user';
  end if;

  candidate := base_username;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    suffix := suffix + 1;
    candidate := left(base_username, 24) || '_' || suffix::text;
  end loop;

  insert into public.profiles (id, display_name, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New Contributor'),
    candidate,
    'contributor'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_moderator_or_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('moderator', 'admin')
  );
$$;

create or replace view public.public_profiles as
select
  id,
  display_name,
  username,
  avatar_url,
  bio,
  city,
  state,
  role,
  points,
  contribution_count,
  created_at
from public.profiles;

insert into public.cities (name, state, slug, latitude, longitude, status)
values ('Rapid City', 'SD', 'rapid-city-sd', 44.080543, -103.231014, 'phase_1_mapping')
on conflict (slug) do nothing;

insert into public.places (
  city_id, name, slug, address, latitude, longitude, category,
  source, current_entry_status, current_summary, community_confidence,
  publish_status, last_verified_at
)
select
  id,
  'Main Street Square',
  'main-street-square',
  '512 Main St, Rapid City, SD',
  44.081900,
  -103.226400,
  'Public plaza',
  'phase_1_seed',
  'likely_independent',
  'Seed Phase 1 record. Community contributors should verify entrance routes, parking, and seasonal surface conditions.',
  0.55,
  'published',
  now()
from public.cities
where slug = 'rapid-city-sd'
on conflict (slug) do nothing;

insert into public.badges (slug, name, description, rule_description, points_value)
values
  ('first-contribution', 'First Contribution', 'Submitted a first meaningful contribution.', 'Award after the first approved contribution.', 10),
  ('first-place-documented', 'First Place Documented', 'Helped document a place for the first time.', 'Award after a contributor publishes a first place report.', 20),
  ('ten-places-helped', 'Ten Places Helped', 'Contributed to ten different places.', 'Award after approved contributions across ten places.', 50),
  ('added-missing-information', 'Added Missing Information', 'Filled in an important missing detail.', 'Award when a contributor adds a requested observation.', 15),
  ('verified-community-information', 'Verified Community Information', 'Helped confirm another report.', 'Award after useful agreement or disagreement on a community report.', 15)
on conflict (slug) do nothing;

alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.places enable row level security;
alter table public.place_photos enable row level security;
alter table public.accessibility_reports enable row level security;
alter table public.report_observations enable row level security;
alter table public.report_verifications enable row level security;
alter table public.contributions enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.moderation_flags enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, username, avatar_url, bio, city, state, updated_at) on public.profiles to authenticated;

grant select on public.cities, public.places, public.accessibility_reports, public.report_observations, public.badges to anon, authenticated;
grant select, insert on public.place_photos, public.accessibility_reports, public.report_observations, public.report_verifications, public.moderation_flags to authenticated;
grant select on public.contributions, public.user_badges to authenticated;

create policy "Profiles are readable by owner"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_moderator_or_admin());

create policy "Contributors can update their editable profile fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Anyone can read supported cities"
on public.cities for select
to anon, authenticated
using (true);

create policy "Anyone can read published places"
on public.places for select
to anon, authenticated
using (publish_status = 'published' or public.is_moderator_or_admin());

create policy "Anyone can read published reports"
on public.accessibility_reports for select
to anon, authenticated
using (status = 'published' or contributor_id = auth.uid() or public.is_moderator_or_admin());

create policy "Contributors can create their own pending reports"
on public.accessibility_reports for insert
to authenticated
with check (contributor_id = auth.uid() and status in ('draft', 'pending_review'));

create policy "Anyone can read observations for visible reports"
on public.report_observations for select
to anon, authenticated
using (
  exists (
    select 1 from public.accessibility_reports r
    where r.id = report_id
      and (r.status = 'published' or r.contributor_id = auth.uid() or public.is_moderator_or_admin())
  )
);

create policy "Contributors can add observations to their own reports"
on public.report_observations for insert
to authenticated
with check (
  exists (
    select 1 from public.accessibility_reports r
    where r.id = report_id
      and r.contributor_id = auth.uid()
      and r.status in ('draft', 'pending_review')
  )
);

create policy "Anyone can read approved photos for published places"
on public.place_photos for select
to anon, authenticated
using (
  moderation_status = 'approved'
  and exists (
    select 1 from public.places p
    where p.id = place_id and p.publish_status = 'published'
  )
  or uploader_id = auth.uid()
  or public.is_moderator_or_admin()
);

create policy "Contributors can create their own pending photo records"
on public.place_photos for insert
to authenticated
with check (uploader_id = auth.uid() and moderation_status = 'pending');

create policy "Contributors can verify published reports"
on public.report_verifications for insert
to authenticated
with check (
  contributor_id = auth.uid()
  and exists (
    select 1 from public.accessibility_reports r
    where r.id = report_id and r.status = 'published'
  )
);

create policy "Contributors can read their own verifications"
on public.report_verifications for select
to authenticated
using (contributor_id = auth.uid() or public.is_moderator_or_admin());

create policy "Contributors can read their own activity"
on public.contributions for select
to authenticated
using (contributor_id = auth.uid() or public.is_moderator_or_admin());

create policy "Anyone can read active badge definitions"
on public.badges for select
to anon, authenticated
using (active = true or public.is_moderator_or_admin());

create policy "Contributors can read their own badges"
on public.user_badges for select
to authenticated
using (user_id = auth.uid() or public.is_moderator_or_admin());

create policy "Anyone signed in can flag content"
on public.moderation_flags for insert
to authenticated
with check (reporter_id = auth.uid() and status = 'pending');

create policy "Moderators can read flags"
on public.moderation_flags for select
to authenticated
using (public.is_moderator_or_admin());

create policy "Moderators can manage profiles"
on public.profiles for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

create policy "Moderators can manage places"
on public.places for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

create policy "Moderators can manage reports"
on public.accessibility_reports for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

create policy "Moderators can manage observations"
on public.report_observations for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

create policy "Moderators can manage photos"
on public.place_photos for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('place-photos', 'place-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Avatar images are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "Users upload avatars to their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update their own avatar files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Moderated place photos are service-readable through signed URLs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'place-photos'
  and ((storage.foldername(name))[2] = auth.uid()::text or public.is_moderator_or_admin())
);

create policy "Users upload place photos to user scoped folders"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'place-photos'
  and (storage.foldername(name))[2] = auth.uid()::text
);
