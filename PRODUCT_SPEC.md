# Can I Get In? Product Spec

Can I Get In? is a mobile-first, community-powered accessibility map. It helps Visitors view factual, photo-supported observations before visiting public places.

## Tagline

Know before you go.

## Phase 1 Scope

- Architecture and open-source documentation.
- Supabase Auth foundation.
- Contributor profiles.
- Initial database schema, RLS policies, storage setup, and seed data.
- Static application shell for Rapid City, South Dakota.
- Mock or seeded place data for map and place profiles.
- First place-photo contribution workflow.
- Account identity, onboarding, privacy export, and self-service deletion foundation.

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

## Phase 1 Routes

- `/`: landing page.
- `/map`: Rapid City map shell.
- `/places/[slug]`: place profile shell.
- `/places/[slug]/contribute`: protected place-photo upload workflow.
- `/contribute`: contribution guidance.
- `/dashboard`: protected Contributor dashboard.
- `/contributors/[username]`: public Contributor profile.
- `/settings/profile`: protected profile editor.
- `/settings/account`: protected account settings.
- `/onboarding/profile`: protected required profile-completion flow.
- `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/callback`: authentication.
- `/admin`: protected placeholder for moderation tools.

## Roadmap

- OpenAI vision analysis.
- Structured AI observations.
- Contributor confirmation of AI findings.
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

- Rapid City is the only active Phase 1 mapping area.
- Phase 1 records can be clearly labeled mock or seed data.
- OpenAI photo analysis is documented but not implemented.
- Human review is required before AI-generated observations are published.
