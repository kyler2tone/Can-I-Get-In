-- Mission 2.1: track provenance for structured accessibility observations.

alter table public.place_accessibility_observations
  add column if not exists evidence_source text not null default 'none';

alter table public.place_accessibility_observations
  drop constraint if exists place_accessibility_observations_evidence_source_check;

alter table public.place_accessibility_observations
  add constraint place_accessibility_observations_evidence_source_check
  check (evidence_source in ('photo', 'contributor', 'mixed', 'conflicting', 'none'));
