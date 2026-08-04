-- Sprint 2: first contributor photo upload workflow.
-- Reuses place_photos and the existing place-photos storage bucket.

update storage.buckets
set
  file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'place-photos';

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
  last_verified_at
)
select
  c.id,
  seed.name,
  seed.slug,
  seed.address,
  seed.latitude,
  seed.longitude,
  seed.category,
  'phase_2_seed',
  seed.current_entry_status::public.entry_outcome,
  seed.current_summary,
  seed.community_confidence,
  'published'::public.publish_status,
  now()
from public.cities c
cross join (
  values
    (
      'The Journey Museum',
      'journey-museum',
      '222 New York St, Rapid City, SD',
      44.089700::numeric,
      -103.220300::numeric,
      'Museum',
      'insufficient_information',
      'Seed Phase 2 record. A contributor needs to document the entrance, route, parking, and interior visitor path.',
      0.20::numeric
    ),
    (
      'Rapid City Public Library',
      'rapid-city-public-library',
      '610 Quincy St, Rapid City, SD',
      44.077400::numeric,
      -103.230400::numeric,
      'Library',
      'may_require_assistance',
      'Seed Phase 2 record. Entrance details, doorway operation, and threshold photos need contributor confirmation.',
      0.45::numeric
    )
) as seed(
  name,
  slug,
  address,
  latitude,
  longitude,
  category,
  current_entry_status,
  current_summary,
  community_confidence
)
where c.slug = 'rapid-city-sd'
on conflict (slug) do update set
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  category = excluded.category,
  current_entry_status = excluded.current_entry_status,
  current_summary = excluded.current_summary,
  community_confidence = excluded.community_confidence,
  publish_status = excluded.publish_status,
  updated_at = now();

grant update (storage_path, category, moderation_status, updated_at)
on public.place_photos
to authenticated;

grant delete on public.place_photos to authenticated;

create policy "Contributors can update their own pending photo records"
on public.place_photos for update
to authenticated
using (uploader_id = auth.uid())
with check (
  uploader_id = auth.uid()
  and moderation_status = 'pending'
);

create policy "Contributors can delete their own photo records"
on public.place_photos for delete
to authenticated
using (uploader_id = auth.uid());

create policy "Anyone can request approved place photo objects"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'place-photos'
  and exists (
    select 1
    from public.place_photos photo
    join public.places place on place.id = photo.place_id
    where photo.storage_path = 'place-photos/' || storage.objects.name
      and photo.moderation_status = 'approved'
      and place.publish_status = 'published'
  )
);

create policy "Users delete their own place photo objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'place-photos'
  and (storage.foldername(name))[2] = auth.uid()::text
);
