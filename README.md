# Can I Get In?

**Know before you go.**

Can I Get In? is an open-source, mobile-first, community-powered accessibility map that helps people understand what they are likely to encounter before visiting a public place.

The project was created for the OpenAI Build for Good Challenge 2026 and begins by mapping Rapid City, South Dakota.

## What We Built

Phase 1 establishes the project foundation:

- Next.js App Router application shell.
- Supabase Auth flows for signup, login, logout, password recovery, reset, and email callback handling.
- Protected Contributor dashboard, profile editor, public Contributor profiles, and future Admin placeholder.
- Rapid City map shell using MapLibre GL JS and clearly labeled Phase 1 sample places.
- Versioned Supabase SQL migration for profiles, cities, places, reports, photos, observations, verification, contribution history, badges, moderation flags, RLS, storage buckets, and seed data.
- First Contributor photo upload workflow for place accessibility photos.
- Open-source documentation, issue templates, PR template, MIT license, and testing foundation.

AI photo analysis is documented as a future feature and is not implemented in Phase 1.

## Who It Helps

- People with mobility limitations, their families, caregivers, and anyone who wants to better understand accessibility before visiting a public place.
- Contributors who can document entrances, thresholds, parking, and routes.
- Moderators and maintainers who need a reviewable foundation for trustworthy community data.
- Municipalities and nonprofit partners who may later support local accessibility mapping drives.

## How It Will Be Used

Visitors search or browse public places and see factual observations such as visible steps, ramp presence, doorway details, surface type, missing information, uncertainty, and community confidence. Contributors will later upload photos and reports. AI-generated observations will require human review before publication.

Can I Get In? provides community observations and planning information. It is not an official accessibility certification, ADA inspection, or guarantee that a location can be entered independently.

## How Codex Helped

Codex helped create the Phase 1 foundation by translating the product brief into a working Next.js/Supabase architecture, writing the initial schema and RLS policies, creating the static app shell, adding documentation, and setting up verification scripts and tests.

## How To Run The Project

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and is used for self-service account deletion. Do not add a Supabase service-role key to any `NEXT_PUBLIC_*` variable.

## Supabase Setup

Apply the project's Supabase migrations to initialize the database schema. Then verify:

- Email/password auth is enabled.
- Site URL is set to `http://localhost:3000` for local development.
- Redirect URLs include `http://localhost:3000/auth/callback`.
- Production redirect URLs include `https://canigetin.app/auth/callback`.
- Google OAuth is enabled only after configuring Google Cloud and the Supabase Google provider.
- Password policy is set to minimum 12 characters and requires uppercase letters, lowercase letters, and numbers.
- Storage buckets `avatars` and `place-photos` exist with the policies from the migration.
- RLS is enabled and tested for anon, Contributor, Moderator, and Admin roles.

## Scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Status

Under development. Sprint 3 adds account identity, onboarding, magic-link and Google sign-in entry points, data export, and account deletion scaffolding. Moderation queues, OpenAI vision analysis, and production data collection are future milestones.
