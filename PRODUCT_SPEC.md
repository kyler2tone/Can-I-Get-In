# Can I Get In? Product Spec

Can I Get In? is a mobile-first, community-powered accessibility map. It helps Visitors view factual, photo-supported observations before visiting public places.

## Tagline

Know before you go.

## Current Product Scope

- Public discovery for published places, city coverage, categories, and nearby results.
- Real Rapid City, South Dakota pilot data and contribution workflow.
- Google Places-powered place search and verified place creation.
- Manual place submission with human Studio review before public discovery.
- Supabase Auth for signup, login, logout, password recovery, magic-link entry points, Google OAuth entry points, and callback handling.
- Contributor profiles, public Contributor pages, onboarding, account settings, privacy export, and self-service deletion.
- Community accessibility photo uploads with categories, mobile camera support, replacement, deletion, and moderation status.
- Structured Contributor observations and notes for accessibility details such as doors, ramps, curb cuts, parking, restrooms, counters, elevators, and interior access.
- Accessibility at a Glance on public place pages.
- OpenAI accessibility analysis that turns approved photos and Contributor observations into structured accessibility observations and public summaries.
- OpenAI-assisted photo moderation that auto-approves only high-confidence, place-relevant, category-matching photos.
- Human Studio review for pending photos, manual place submissions, suggested updates, and manual accessibility analysis.
- Contributor dashboard, points, badges, and contribution history.
- Supabase schema, RLS policies, storage buckets, seed data, and migrations.
- Open-source documentation, issue templates, PR template, MIT license, and testing foundation.

## Users

- Visitor: browses and searches without an account.
- Contributor: registered user who can submit photos and reports.
- Moderator: reviews and hides inappropriate or inaccurate content.
- Admin: full project control.

## Product Principles

- Describe what a visitor is likely to encounter.
- Do not make legal or ADA-compliance determinations.
- Avoid vague binary labels such as accessible or not accessible.
- Use factual observations, including visible steps, ramp presence, doorway operation, threshold estimates, surface type, accessible parking visibility, uncertainty, and missing information.
- Keep the app useful without shaming businesses.

## Current Routes

- `/`: home and discovery entry point.
- `/map`: searchable place map and list.
- `/cities`: city discovery.
- `/places/add`: protected place search and place creation workflow.
- `/places/[slug]`: public place profile with Accessibility at a Glance, AI summary, community photos, and update request flow.
- `/places/[slug]/contribute`: protected place-photo upload workflow.
- `/contribute`: contribution guidance.
- `/dashboard`: protected Contributor dashboard.
- `/contributors/[username]`: public Contributor profile.
- `/settings/profile`: protected profile editor.
- `/settings/account`: protected account settings.
- `/onboarding/profile`: protected required profile-completion flow.
- `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/callback`: authentication.
- `/studio`: protected Moderator/Admin workspace.
- `/studio/photos`: photo moderation queue.
- `/studio/places`: manual place review queue.
- `/studio/updates`: suggested update queue.

## Roadmap

- Community verification.
- Photo-quality guidance.
- Duplicate-photo detection.
- Temporary barriers and broken-elevator reports.
- Business page claims.
- Community challenges and quests.
- Seasonal events.
- Contribution streaks and active-month recognition.
- Sponsored community mapping events.
- Donated prizes and downtown gift cards.
- City-sponsored accessibility drives.
- QR contribution codes.
- Additional accessibility categories.
- Accessible route planning.
- Deadwood expansion.
- Municipality and nonprofit partnerships.

Sponsored organizations must never be able to purchase favorable accessibility results or manipulate search rankings.

## Assumptions

- Rapid City is the active pilot city for the Build for Good submission.
- Communities can begin coverage organically by adding the first places in a city.
- OpenAI analysis and moderation support community workflows but do not certify accessibility or make ADA/legal determinations.
- Human Studio review remains the fallback for ambiguous moderation and review decisions.
