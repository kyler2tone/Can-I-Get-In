# Architecture

## Stack

- Next.js App Router with TypeScript strict mode.
- Tailwind CSS for styling.
- Supabase Postgres, Auth, Storage, and Row Level Security.
- MapLibre GL JS for maps.
- Vitest for utility tests.
- Vercel-compatible deployment.

## Application Structure

- `src/app`: routes and route handlers.
- `src/components`: reusable UI, auth forms, map components, and shell layout.
- `src/components/contributions`: Contributor upload workflow components.
- `src/lib`: Supabase clients, auth helpers, role checks, discovery queries, OpenAI integrations, Google Places helpers, server actions, validation, sample data, and shared types.
- `supabase/migrations`: versioned SQL migrations.
- `tests`: Vitest tests.

## Supabase Auth

Email/password signup, login, logout, forgot-password, reset-password, email verification, magic-link login, Google OAuth entry points, and auth callback routes are implemented. The app uses the Supabase publishable key in browser-safe contexts only. Service role keys must never be exposed with `NEXT_PUBLIC_`.

Profiles are created automatically by the `handle_new_user` trigger after `auth.users` receives a new user.

All confirmation, reset, magic-link, and OAuth redirects use `NEXT_PUBLIC_SITE_URL` through `/auth/callback`. Local development should set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`; production should set `NEXT_PUBLIC_SITE_URL=https://canigetin.app`.

Email, username, and display name are separate. Email is private Supabase Auth identity. Username is the unique public URL handle and is normalized to lowercase. Display name is the editable public friendly name. New users receive a non-email placeholder username and must complete profile onboarding before contributing photos.

## Database Tables

- `profiles`: Contributor identity and public profile fields.
- `username_redirects`: records old and new usernames for future public redirect support.
- `cities`: supported city metadata and mapping status.
- `places`: public locations displayed on the map.
- `place_photos`: submitted photo records.
- `place_ai_analyses`: OpenAI accessibility analysis runs, status, model, evidence fingerprint, public summary, and metadata.
- `place_accessibility_observations`: structured per-place accessibility observations produced from approved evidence.
- `contributor_place_observations`: structured Contributor observations and notes submitted during contribution.
- `place_update_requests`: Contributor corrections and follow-up requests for published place accessibility information.
- `accessibility_reports`: visit/report history.
- `report_observations`: structured factual observations.
- `report_verifications`: community agree, disagree, and flag votes.
- `contributions`: activity ledger for points and history.
- `badges`: badge definitions.
- `user_badges`: badges earned by users.
- `moderation_flags`: reports of inaccurate, outdated, unsafe, abusive, or inappropriate content.

## RLS Policy Summary

- `profiles`: authenticated users can read and update only their own profile. Public-safe fields are exposed through `public_profiles`. Moderators and admins can manage profiles.
- Username changes are performed through `complete_profile` and `change_username` RPCs. Ordinary profile updates cannot update username, role, points, or contribution counts.
- `cities`: anyone can read supported cities.
- `places`: anyone can read published places. Moderators and admins can manage places.
- `place_photos`: anyone can read approved photos for published places; uploaders can read their own pending photos; Contributors can create their own pending photo records; moderators can manage photos.
- `place_ai_analyses`: anyone can read succeeded analyses for published places; moderators and admins can manage analyses.
- `place_accessibility_observations`: anyone can read observations for published places; moderators and admins can manage observations.
- `contributor_place_observations`: Contributors with completed profiles can insert their own observations and read their own submissions; moderators and admins can manage submissions.
- `place_update_requests`: Contributors with completed profiles can suggest updates and read their own requests; moderators and admins can manage requests.
- `accessibility_reports`: anyone can read published reports; Contributors can read and create their own draft or pending reports; moderators can manage reports.
- `report_observations`: anyone can read observations attached to visible reports; Contributors can add observations to their own draft or pending reports; moderators can manage observations.
- `report_verifications`: Contributors can verify published reports and read their own verifications.
- `contributions`: Contributors can read their own activity only. Points are service/moderation controlled.
- `badges`: anyone can read active badge definitions.
- `user_badges`: Contributors can read their own earned badges. Contributors cannot award badges to themselves.
- `moderation_flags`: signed-in users can create pending flags; moderators can read and resolve them.

## Storage

Buckets:

- `avatars`: public-read, authenticated write to `{user_id}/{filename}`, max 2 MB, JPEG/PNG/WebP.
- `place-photos`: private, authenticated upload to `{place_id}/{user_id}/{filename}`, max 15 MB, JPEG/PNG/WebP.

The app stores predictable full paths in database records:

- `avatars/{user_id}/{filename}`
- `place-photos/{place_id}/{user_id}/{filename}`

Place photos should be shown publicly only after moderation approval, normally through signed URLs or a server-mediated public surface.

## Contributor Photo Workflow

Logged-in Contributors can open a place page and use "Help improve this place" to upload one or more accessibility photos. The browser workflow supports mobile camera capture, mobile gallery selection, desktop file picker, and desktop drag and drop.

The client validates image type, compresses large images with canvas before upload, enforces a 15 MB post-compression maximum, uploads to Supabase Storage with an XMLHttpRequest progress indicator, then writes the existing `place_photos` record through RLS. Uploaded photos are associated with place, contributor, category, moderation status, and upload timestamp.

Contributors can delete or replace their own photo records. Replacement uploads a new storage object, updates the existing `place_photos` row, and removes the old object. Contributors cannot modify another Contributor's uploads under the Sprint 2 RLS policies.

Photos are grouped by category on place pages. Pending photos are visible to their uploader immediately; approved photos are visible to public visitors.

The photo contribution route requires a completed profile. Incomplete profiles redirect to `/onboarding/profile` before upload controls are available.

## Privacy And Account Deletion

`/settings/account/export` returns JSON for the authenticated user only. It includes profile information, contribution history, places helped, uploaded photo metadata, reports, verifications, badges, and points where present. It intentionally excludes Supabase Auth internals, secrets, moderation-only fields, other Contributors' private data, and raw image files.

Self-service account deletion is in the Danger Zone on Account Settings. It requires typing `DELETE` and uses a server-only Supabase service-role key through `SUPABASE_SERVICE_ROLE_KEY`. The service key must be configured in Vercel and must never be exposed to the browser.

Deletion removes the Supabase Auth user and public Contributor profile. Community accessibility records and uploaded photo metadata are retained where technically appropriate, with Contributor foreign keys set to `null` by the Sprint 3 migration. Public UI should treat null contributor identities as Former Contributor or Anonymous Contributor.

## OpenAI Integration

OpenAI is integrated through the Responses API for two implemented server-side workflows.

Photo moderation runs after a Contributor submits a place photo. The app creates a short-lived signed URL for the private `place-photos` object, sends it to OpenAI with the selected photo category, and expects structured JSON describing whether the image is place-relevant and category-matching. High-confidence valid results can be auto-approved; uncertain, low-confidence, unrelated, or ambiguous results remain pending for human Studio review.

Accessibility analysis runs against approved place photos and structured Contributor observations. The app fingerprints the current evidence, skips repeated analysis for unchanged evidence, queues a `place_ai_analyses` row, sends approved evidence to OpenAI, validates the JSON response with Zod, and stores structured findings in `place_accessibility_observations` plus a public summary in `place_ai_analyses`.

The analysis prompt is intentionally conservative. It does not declare a place accessible, inaccessible, ADA compliant, or legally compliant. It preserves `unknown` when evidence is missing, cropped, ambiguous, conflicting, or insufficient, and it supports more specific states for doors, restrooms, counters, elevators, and other accessibility factors where binary yes/no would erase useful context.

Studio users with moderator or admin roles can manually run accessibility analysis and review pending photos, manual place submissions, and suggested updates. AI handles scalable interpretation and obvious cases; people remain responsible for ambiguous ones.

## Authentication And Authorization Test Plan

- Signup creates an auth user and a default contributor profile.
- Email verification link lands on `/auth/callback` and redirects to `/dashboard`.
- Login creates a session and protected routes load.
- Logout clears the session.
- Forgot password sends a reset email.
- Password reset link lands on `/auth/reset-password` after callback exchange.
- A Contributor can update editable profile fields only.
- A Contributor cannot update `role`, `points`, or `contribution_count`.
- Anonymous users cannot access `/dashboard`, `/settings/profile`, or `/admin`.

## RLS Verification Plan

Use separate anon, contributor, moderator, and admin sessions. Verify:

- Anonymous users can read published places and active badges only.
- Contributors can insert only their own pending reports and photo records.
- Contributors can update, delete, and replace only their own photo records and storage objects.
- Incomplete profiles cannot submit photos through the app route.
- Users can export or delete only their own account data.
- Contributors cannot change another user's content.
- Contributors cannot publish hidden/admin-controlled content directly.
- Contributors cannot assign points, badges, moderator role, or admin role.
- Moderators and admins can perform moderation actions.
