-- Sprint 3: account identity, onboarding, auth, and privacy foundation.
-- Preserves existing community contribution data while allowing personal identity deletion.

alter table public.profiles
  add column if not exists profile_completed boolean not null default false,
  add column if not exists username_changed_at timestamptz,
  add column if not exists deleted_at timestamptz;

update public.profiles
set profile_completed = true
where profile_completed = false
  and username !~ '^contributor-[a-f0-9]{12}$';

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[a-z0-9_-]{3,32}$');

create table if not exists public.username_redirects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  old_username text not null,
  new_username text not null,
  changed_at timestamptz not null default now(),
  constraint username_redirects_old_format check (old_username ~ '^[a-z0-9_-]{3,32}$'),
  constraint username_redirects_new_format check (new_username ~ '^[a-z0-9_-]{3,32}$')
);

create unique index if not exists username_redirects_old_username_unique
on public.username_redirects (lower(old_username));

create index if not exists username_redirects_user_idx
on public.username_redirects (user_id, changed_at desc);

alter table public.username_redirects enable row level security;
grant select on public.username_redirects to anon, authenticated;

create policy "Anyone can read username redirects"
on public.username_redirects for select
to anon, authenticated
using (true);

create or replace function public.normalize_username(candidate text)
returns text
language sql
immutable
as $$
  select lower(trim(candidate));
$$;

create or replace function public.is_reserved_username(candidate text)
returns boolean
language sql
immutable
as $$
  select public.normalize_username(candidate) = any(array[
    'admin',
    'administrator',
    'moderator',
    'support',
    'api',
    'auth',
    'login',
    'signup',
    'settings',
    'dashboard',
    'contribute',
    'contributors',
    'places',
    'map',
    'canigetin'
  ]);
$$;

create or replace function public.is_username_available(candidate text, excluded_user_id uuid default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    public.normalize_username(candidate) ~ '^[a-z0-9_-]{3,32}$'
    and not public.is_reserved_username(candidate)
    and not exists (
      select 1
      from public.profiles
      where lower(username) = public.normalize_username(candidate)
        and (excluded_user_id is null or id <> excluded_user_id)
    );
$$;

create or replace function public.generate_placeholder_username()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'contributor-' || substr(encode(gen_random_bytes(8), 'hex'), 1, 12);
    exit when not exists (
      select 1 from public.profiles where lower(username) = lower(candidate)
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username, role, profile_completed)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New Contributor'),
    public.generate_placeholder_username(),
    'contributor',
    false
  );

  return new;
end;
$$;

create or replace function public.complete_profile(candidate_username text, candidate_display_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  normalized := public.normalize_username(candidate_username);

  if not public.is_username_available(normalized, auth.uid()) then
    raise exception 'That username is not available.';
  end if;

  if length(trim(candidate_display_name)) < 1 or length(trim(candidate_display_name)) > 80 then
    raise exception 'Display name must be between 1 and 80 characters.';
  end if;

  update public.profiles
  set
    username = normalized,
    display_name = trim(candidate_display_name),
    profile_completed = true,
    username_changed_at = coalesce(username_changed_at, now()),
    updated_at = now()
  where id = auth.uid()
  returning * into updated_profile;

  return updated_profile;
end;
$$;

create or replace function public.change_username(candidate_username text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  previous_username text;
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  normalized := public.normalize_username(candidate_username);

  select username into previous_username
  from public.profiles
  where id = auth.uid();

  if previous_username is null then
    raise exception 'Profile not found.';
  end if;

  if previous_username = normalized then
    raise exception 'That is already your username.';
  end if;

  if not public.is_username_available(normalized, auth.uid()) then
    raise exception 'That username is not available.';
  end if;

  update public.profiles
  set
    username = normalized,
    profile_completed = true,
    username_changed_at = now(),
    updated_at = now()
  where id = auth.uid()
  returning * into updated_profile;

  update public.username_redirects
  set new_username = normalized,
      changed_at = now()
  where lower(old_username) = lower(previous_username);

  if not found then
    insert into public.username_redirects (user_id, old_username, new_username)
    values (auth.uid(), previous_username, normalized);
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.is_username_available(text, uuid) to anon, authenticated;
grant execute on function public.complete_profile(text, text) to authenticated;
grant execute on function public.change_username(text) to authenticated;

revoke update on public.profiles from authenticated;
grant update (
  display_name,
  avatar_url,
  bio,
  city,
  state,
  updated_at
) on public.profiles to authenticated;

drop policy if exists "Contributors can update their editable profile fields" on public.profiles;
create policy "Contributors can update their editable non-identity profile fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select role from public.profiles where id = auth.uid())
  and points = (select points from public.profiles where id = auth.uid())
  and contribution_count = (select contribution_count from public.profiles where id = auth.uid())
);

alter table public.place_photos
  alter column uploader_id drop not null;

alter table public.accessibility_reports
  alter column contributor_id drop not null;

alter table public.report_verifications
  alter column contributor_id drop not null;

alter table public.contributions
  alter column contributor_id drop not null;

alter table public.user_badges
  alter column user_id drop not null;

alter table public.place_photos drop constraint if exists place_photos_uploader_id_fkey;
alter table public.place_photos
  add constraint place_photos_uploader_id_fkey
  foreign key (uploader_id) references public.profiles(id) on delete set null;

alter table public.accessibility_reports drop constraint if exists accessibility_reports_contributor_id_fkey;
alter table public.accessibility_reports
  add constraint accessibility_reports_contributor_id_fkey
  foreign key (contributor_id) references public.profiles(id) on delete set null;

alter table public.report_verifications drop constraint if exists report_verifications_contributor_id_fkey;
alter table public.report_verifications
  add constraint report_verifications_contributor_id_fkey
  foreign key (contributor_id) references public.profiles(id) on delete set null;

alter table public.contributions drop constraint if exists contributions_contributor_id_fkey;
alter table public.contributions
  add constraint contributions_contributor_id_fkey
  foreign key (contributor_id) references public.profiles(id) on delete set null;

alter table public.user_badges drop constraint if exists user_badges_user_id_fkey;
alter table public.user_badges
  add constraint user_badges_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

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
from public.profiles
where deleted_at is null
  and profile_completed = true;

drop policy if exists "Contributors can create their own pending photo records" on public.place_photos;
create policy "Contributors with completed profiles can create their own pending photo records"
on public.place_photos for insert
to authenticated
with check (
  uploader_id = auth.uid()
  and moderation_status = 'pending'
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and profile_completed = true
      and deleted_at is null
  )
);

drop policy if exists "Contributors can update their own pending photo records" on public.place_photos;
create policy "Contributors with completed profiles can update their own pending photo records"
on public.place_photos for update
to authenticated
using (uploader_id = auth.uid())
with check (
  uploader_id = auth.uid()
  and moderation_status = 'pending'
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and profile_completed = true
      and deleted_at is null
  )
);

drop policy if exists "Users upload place photos to user scoped folders" on storage.objects;
create policy "Users with completed profiles upload place photos to user scoped folders"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'place-photos'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and profile_completed = true
      and deleted_at is null
  )
);
