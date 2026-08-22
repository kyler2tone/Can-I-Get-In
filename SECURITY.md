# Security

Please report security concerns privately to the maintainers before public disclosure.

## Sensitive Data

- Do not commit Supabase service-role keys.
- Do not commit OpenAI API keys or Google Places API keys.
- Do not expose server-only credentials through `NEXT_PUBLIC_*`.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `GOOGLE_PLACES_API_KEY` server-only.
- Avoid uploading photos that intentionally capture faces, license plates, or private areas.

## Current Security Boundaries

- Browser code uses only the Supabase publishable key.
- Self-service account deletion uses `SUPABASE_SERVICE_ROLE_KEY` only from server-side route handling.
- OpenAI photo moderation and accessibility analysis run server-side against short-lived signed Supabase Storage URLs.
- Google Places lookup runs server-side through the configured Google Places API key.
- Supabase Row Level Security protects Contributor-owned profile, contribution, report, photo, badge, export, and update-request data.
- The `place-photos` bucket is private. Approved public photos are served through signed URLs or server-mediated access.
- Ambiguous photo moderation results remain pending for human Studio review instead of being automatically rejected.

## Supported Reports

Report:

- Auth or session handling issues.
- RLS bypasses.
- Public exposure of private storage files.
- Exposure of server-only OpenAI, Google Places, or Supabase service-role credentials.
- Unsafe photo or moderation flows.
- Dependency vulnerabilities with a practical exploit path.

## Production Review

Production maintainers should continue verifying RLS policies, storage access, auth redirects, moderation boundaries, and server-only environment variable handling against real Supabase roles before expanding access beyond the current pilot.
