-- Mission 1.5: user-facing place creation and Studio place review workflow.

alter table public.places
  add column if not exists google_place_id text,
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists postal_code text,
  add column if not exists website text,
  add column if not exists verification_notes text;

create unique index if not exists places_google_place_id_unique
on public.places (google_place_id)
where google_place_id is not null;

create index if not exists places_review_queue_idx
on public.places (publish_status, created_at)
where publish_status = 'pending_review';

create index if not exists places_submitted_by_idx
on public.places (submitted_by, created_at desc);

drop policy if exists "Anyone can read published places" on public.places;
create policy "Anyone can read visible places"
on public.places for select
to anon, authenticated
using (
  publish_status = 'published'
  or submitted_by = auth.uid()
  or public.is_moderator_or_admin()
);

grant update (
  city_id,
  name,
  slug,
  address,
  latitude,
  longitude,
  category,
  source,
  external_source_id,
  current_entry_status,
  current_summary,
  community_confidence,
  publish_status,
  last_verified_at,
  reviewed_by,
  reviewed_at,
  postal_code,
  website,
  verification_notes,
  updated_at
) on public.places to authenticated;

create or replace function public.slugify_place(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(trim(coalesce(value, 'place'))), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.unique_place_slug(base_value text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  suffix int := 1;
begin
  base_slug := left(coalesce(nullif(public.slugify_place(base_value), ''), 'place'), 72);
  candidate := base_slug;

  while exists (select 1 from public.places where slug = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_slug, greatest(1, 72 - length(suffix::text) - 1)) || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

create or replace function public.find_or_create_city(
  p_city text,
  p_state text,
  p_latitude numeric,
  p_longitude numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_city text;
  normalized_state text;
  city_slug text;
  existing_id uuid;
  created_id uuid;
begin
  normalized_city := trim(p_city);
  normalized_state := upper(trim(p_state));

  if length(normalized_city) < 1 or length(normalized_state) < 1 then
    raise exception 'City and state are required.';
  end if;

  city_slug := public.slugify_place(normalized_city || '-' || normalized_state);

  select id into existing_id
  from public.cities
  where slug = city_slug;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.cities (name, state, slug, latitude, longitude, status)
  values (normalized_city, normalized_state, city_slug, p_latitude, p_longitude, 'active')
  on conflict (slug) do update
    set updated_at = now()
  returning id into created_id;

  return created_id;
end;
$$;

create or replace function public.create_google_verified_place(
  p_google_place_id text,
  p_name text,
  p_address text,
  p_city text,
  p_state text,
  p_postal_code text,
  p_latitude numeric,
  p_longitude numeric,
  p_category text
)
returns table(place_id uuid, place_slug text, created boolean, publish_status public.publish_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  city_id_value uuid;
  inserted_id uuid;
  inserted_slug text;
  existing_record record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if length(trim(coalesce(p_google_place_id, ''))) < 1 then
    raise exception 'Choose a verified place result.';
  end if;

  if length(trim(coalesce(p_name, ''))) < 2 or length(trim(coalesce(p_address, ''))) < 4 then
    raise exception 'Place name and address are required.';
  end if;

  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'Place coordinates are invalid.';
  end if;

  select existing.id, existing.slug, existing.publish_status into existing_record
  from public.places existing
  where existing.google_place_id = p_google_place_id
  limit 1;

  if existing_record.id is not null then
    place_id := existing_record.id;
    place_slug := existing_record.slug;
    created := false;
    publish_status := existing_record.publish_status;
    return next;
    return;
  end if;

  city_id_value := public.find_or_create_city(p_city, p_state, p_latitude, p_longitude);
  inserted_slug := public.unique_place_slug(p_name || '-' || p_city || '-' || p_state);

  insert into public.places (
    city_id,
    name,
    slug,
    address,
    latitude,
    longitude,
    category,
    source,
    external_source_id,
    google_place_id,
    current_entry_status,
    current_summary,
    community_confidence,
    publish_status,
    last_verified_at,
    submitted_by,
    postal_code,
    verification_notes
  )
  values (
    city_id_value,
    trim(p_name),
    inserted_slug,
    trim(p_address),
    p_latitude,
    p_longitude,
    nullif(trim(coalesce(p_category, '')), ''),
    'google_places',
    p_google_place_id,
    p_google_place_id,
    'insufficient_information',
    'This place was added from a verified place lookup. Accessibility details still need community photos.',
    0,
    'published',
    now(),
    auth.uid(),
    nullif(trim(coalesce(p_postal_code, '')), ''),
    'Verified by Google Places lookup.'
  )
  returning id, slug into inserted_id, inserted_slug;

  place_id := inserted_id;
  place_slug := inserted_slug;
  created := true;
  publish_status := 'published';
  return next;
end;
$$;

create or replace function public.create_manual_place_submission(
  p_name text,
  p_address text,
  p_city text,
  p_state text,
  p_postal_code text,
  p_latitude numeric,
  p_longitude numeric,
  p_category text,
  p_website text,
  p_notes text
)
returns table(place_id uuid, place_slug text, created boolean, publish_status public.publish_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  city_id_value uuid;
  inserted_id uuid;
  inserted_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Place name is required.';
  end if;

  if length(trim(coalesce(p_address, ''))) < 4 then
    raise exception 'Address or location description is required.';
  end if;

  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'Place coordinates are invalid.';
  end if;

  city_id_value := public.find_or_create_city(p_city, p_state, p_latitude, p_longitude);
  inserted_slug := public.unique_place_slug(p_name || '-' || p_city || '-' || p_state);

  insert into public.places (
    city_id,
    name,
    slug,
    address,
    latitude,
    longitude,
    category,
    source,
    current_entry_status,
    current_summary,
    community_confidence,
    publish_status,
    submitted_by,
    postal_code,
    website,
    verification_notes
  )
  values (
    city_id_value,
    trim(p_name),
    inserted_slug,
    trim(p_address),
    p_latitude,
    p_longitude,
    nullif(trim(coalesce(p_category, '')), ''),
    'community_manual',
    'insufficient_information',
    'This place was submitted by a Contributor and is awaiting review before public discovery.',
    0,
    'pending_review',
    auth.uid(),
    nullif(trim(coalesce(p_postal_code, '')), ''),
    nullif(trim(coalesce(p_website, '')), ''),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id, slug into inserted_id, inserted_slug;

  place_id := inserted_id;
  place_slug := inserted_slug;
  created := true;
  publish_status := 'pending_review';
  return next;
end;
$$;

grant execute on function public.create_google_verified_place(text, text, text, text, text, text, numeric, numeric, text) to authenticated;
grant execute on function public.create_manual_place_submission(text, text, text, text, text, numeric, numeric, text, text, text) to authenticated;
