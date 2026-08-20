-- Focused fix: preserve semantic accessibility states instead of collapsing everything to yes/no.

alter type public.accessibility_observation_status add value if not exists 'automatic';
alter type public.accessibility_observation_status add value if not exists 'door_not_automatic';
alter type public.accessibility_observation_status add value if not exists 'no_door_on_site';
alter type public.accessibility_observation_status add value if not exists 'restroom_available';
alter type public.accessibility_observation_status add value if not exists 'restroom_present_not_accessible';
alter type public.accessibility_observation_status add value if not exists 'no_restroom_on_site';
alter type public.accessibility_observation_status add value if not exists 'lower_accessible_height';
alter type public.accessibility_observation_status add value if not exists 'standing_height';
alter type public.accessibility_observation_status add value if not exists 'not_applicable';
alter type public.accessibility_observation_status add value if not exists 'not_needed';

alter table public.contributor_place_observations
  drop constraint if exists contributor_place_observations_notes_length_check;

alter table public.contributor_place_observations
  add constraint contributor_place_observations_notes_length_check
  check (notes is null or char_length(notes) <= 2000);
