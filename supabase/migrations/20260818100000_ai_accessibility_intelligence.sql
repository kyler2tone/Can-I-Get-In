-- Mission 2: AI accessibility intelligence, contributor evidence, and suggested updates.

create type public.accessibility_observation_status as enum ('yes', 'no', 'unknown');
create type public.place_ai_analysis_status as enum ('pending', 'succeeded', 'failed');
create type public.update_request_status as enum ('pending', 'accepted', 'rejected');

create table public.place_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  status public.place_ai_analysis_status not null default 'pending',
  model text not null,
  evidence_fingerprint text not null,
  public_summary text,
  error_message text,
  images_analyzed integer not null default 0 check (images_analyzed >= 0),
  usage_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  analyzed_at timestamptz,
  unique(place_id, evidence_fingerprint)
);

create index place_ai_analyses_place_idx
on public.place_ai_analyses(place_id, created_at desc);

create table public.place_accessibility_observations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  analysis_id uuid references public.place_ai_analyses(id) on delete set null,
  factor text not null,
  status public.accessibility_observation_status not null default 'unknown',
  confidence numeric(3,2) not null default 0 check (confidence >= 0 and confidence <= 1),
  evidence_summary text not null default '',
  evidence_photo_ids uuid[] not null default array[]::uuid[],
  source text not null default 'ai',
  last_analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(place_id, factor),
  constraint place_accessibility_observations_factor_format check (factor ~ '^[a-z0-9_]{3,64}$')
);

create index place_accessibility_observations_place_idx
on public.place_accessibility_observations(place_id);

create table public.contributor_place_observations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  contributor_id uuid references public.profiles(id) on delete set null,
  photo_ids uuid[] not null default array[]::uuid[],
  observations jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index contributor_place_observations_place_idx
on public.contributor_place_observations(place_id, created_at desc);

create table public.place_update_requests (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  contributor_id uuid references public.profiles(id) on delete set null,
  factors text[] not null default array[]::text[],
  suggested_status public.accessibility_observation_status,
  explanation text not null,
  status public.update_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint place_update_requests_explanation_length check (length(trim(explanation)) between 3 and 1000)
);

create index place_update_requests_status_idx
on public.place_update_requests(status, created_at);

create trigger place_accessibility_observations_set_updated_at before update on public.place_accessibility_observations
for each row execute function public.set_updated_at();

alter table public.place_ai_analyses enable row level security;
alter table public.place_accessibility_observations enable row level security;
alter table public.contributor_place_observations enable row level security;
alter table public.place_update_requests enable row level security;

grant select on public.place_ai_analyses, public.place_accessibility_observations to anon, authenticated;
grant select, insert on public.contributor_place_observations, public.place_update_requests to authenticated;
grant update (status, reviewed_by, reviewed_at) on public.place_update_requests to authenticated;
grant insert, update on public.place_ai_analyses, public.place_accessibility_observations to authenticated;

create policy "Anyone can read successful place analyses"
on public.place_ai_analyses for select
to anon, authenticated
using (
  status = 'succeeded'
  and exists (
    select 1 from public.places p
    where p.id = place_id and p.publish_status = 'published'
  )
  or public.is_moderator_or_admin()
);

create policy "Anyone can read published accessibility observations"
on public.place_accessibility_observations for select
to anon, authenticated
using (
  exists (
    select 1 from public.places p
    where p.id = place_id and p.publish_status = 'published'
  )
  or public.is_moderator_or_admin()
);

create policy "Contributors can add their own place observations"
on public.contributor_place_observations for insert
to authenticated
with check (
  contributor_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
      and profile_completed = true
      and deleted_at is null
  )
);

create policy "Contributors can read their own place observations"
on public.contributor_place_observations for select
to authenticated
using (contributor_id = auth.uid() or public.is_moderator_or_admin());

create policy "Contributors can suggest place updates"
on public.place_update_requests for insert
to authenticated
with check (
  contributor_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
      and profile_completed = true
      and deleted_at is null
  )
);

create policy "Contributors can read their own suggested updates"
on public.place_update_requests for select
to authenticated
using (contributor_id = auth.uid() or public.is_moderator_or_admin());

create policy "Moderators can manage AI analyses"
on public.place_ai_analyses for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

create policy "Moderators can manage accessibility observations"
on public.place_accessibility_observations for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

create policy "Moderators can manage contributor place observations"
on public.contributor_place_observations for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

create policy "Moderators can manage suggested updates"
on public.place_update_requests for all
to authenticated
using (public.is_moderator_or_admin())
with check (public.is_moderator_or_admin());

create or replace function public.mark_place_ai_analysis_pending(p_place_id uuid, p_model text, p_fingerprint text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  analysis_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_moderator_or_admin() then
    raise exception 'Studio access required.';
  end if;

  insert into public.place_ai_analyses (place_id, status, model, evidence_fingerprint)
  values (p_place_id, 'pending', p_model, p_fingerprint)
  on conflict (place_id, evidence_fingerprint) do update
    set status = 'pending',
        error_message = null,
        created_at = now()
  returning id into analysis_id;

  return analysis_id;
end;
$$;

grant execute on function public.mark_place_ai_analysis_pending(uuid, text, text) to authenticated;
