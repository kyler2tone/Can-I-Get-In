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
- `src/lib`: Supabase clients, auth helpers, server actions, validation, sample data, and shared types.
- `supabase/migrations`: versioned SQL migrations.
- `tests`: Vitest tests.

## Supabase Auth

Email/password signup, login, logout, forgot-password, reset-password, email verification, and auth callback routes are implemented. The app uses the Supabase publishable key in browser-safe contexts only. Service role keys are not needed in Phase 1 and must never be exposed with `NEXT_PUBLIC_`.

Profiles are created automatically by the `handle_new_user` trigger after `auth.users` receives a new user.

## Database Tables

- `profiles`: Contributor identity and public profile fields.
- `cities`: supported city metadata and mapping status.
- `places`: public locations displayed on the map.
- `place_photos`: submitted photo records.
- `accessibility_reports`: visit/report history.
- `report_observations`: structured factual observations.
- `report_verifications`: community agree, disagree, and flag votes.
- `contributions`: activity ledger for points and history.
- `badges`: badge definitions.
- `user_badges`: badges earned by users.
- `moderation_flags`: reports of inaccurate, outdated, unsafe, abusive, or inappropriate content.

## RLS Policy Summary

- `profiles`: authenticated users can read and update only their own profile. Public-safe fields are exposed through `public_profiles`. Moderators and admins can manage profiles.
- `cities`: anyone can read supported cities.
- `places`: anyone can read published places. Moderators and admins can manage places.
- `place_photos`: anyone can read approved photos for published places; uploaders can read their own pending photos; Contributors can create their own pending photo records; moderators can manage photos.
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
- `place-photos`: private, authenticated upload to `{place_id}/{user_id}/{filename}`, max 10 MB, JPEG/PNG/WebP.

The app stores predictable full paths in database records:

- `avatars/{user_id}/{filename}`
- `place-photos/{place_id}/{user_id}/{filename}`

Place photos should be shown publicly only after moderation approval, normally through signed URLs or a server-mediated public surface.

## OpenAI Integration

OpenAI vision analysis is a future Phase 2 feature. AI-generated observations must include uncertainty and require human Contributor review before publication.

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
- Contributors cannot change another user's content.
- Contributors cannot publish hidden/admin-controlled content directly.
- Contributors cannot assign points, badges, moderator role, or admin role.
- Moderators and admins can perform moderation actions.
