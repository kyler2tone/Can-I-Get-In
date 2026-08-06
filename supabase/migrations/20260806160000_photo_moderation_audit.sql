-- Sprint 4: photo moderation audit fields for Studio review workflows.

alter table public.place_photos
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists place_photos_moderation_queue_idx
on public.place_photos(moderation_status, created_at);

grant update (moderation_status, reviewed_by, reviewed_at, updated_at)
on public.place_photos
to authenticated;
