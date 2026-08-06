# Authentication Setup

## Environment Variables

Public browser-safe variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only variable:

- `SUPABASE_SERVICE_ROLE_KEY`

Never expose the service-role key through `NEXT_PUBLIC_*`.

## Supabase Dashboard

1. Open Authentication > URL Configuration.
2. Set Site URL to `https://canigetin.app` in production or `http://localhost:3000` locally.
3. Add redirect URLs:
   - `https://canigetin.app/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Enable the Email provider and keep normal signup email confirmation enabled.
5. In password security settings, configure the project password policy:
   - Minimum password length: `12`
   - Require at least one uppercase letter.
   - Require at least one lowercase letter.
   - Require at least one number.
   - Leave any additional character requirements disabled.
   - Enable leaked password protection if the project plan supports it.
6. Enable Magic Link or OTP email templates using Supabase defaults.
7. Enable Google provider after completing Google Cloud setup.

## Google Cloud

1. Create or select a Google Cloud project.
2. Configure the OAuth consent screen for Can I Get In?
3. Add scopes: `openid`, userinfo email, and userinfo profile.
4. Create an OAuth client ID with application type `Web application`.
5. Add Authorized JavaScript origins:
   - `https://canigetin.app`
   - `http://localhost:3000`
6. Add the Authorized redirect URI shown in the Supabase Google provider settings. For hosted Supabase this is usually the Supabase project callback URL, not `/auth/callback`.
7. Copy the Google Client ID and Client Secret into the Supabase Google provider settings.

## Vercel

Set these environment variables:

- `NEXT_PUBLIC_SITE_URL=https://canigetin.app`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` must be server-only and must not be exposed to client-side code.

## Manual Browser Tests

- Email/password signup confirms through `https://canigetin.app/auth/callback`.
- Login works with current password autocomplete.
- Signup password managers suggest and save strong passwords.
- Magic-link login returns through `/auth/callback`.
- Google sign-in returns through `/auth/callback`.
- New users land on profile onboarding before contributing photos.
- Completed users can upload, replace, and delete their own photos.
- Account export downloads JSON for the signed-in user.
- Delete account signs the user out and removes the public profile.
