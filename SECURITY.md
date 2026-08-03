# Security

Please report security concerns privately to the maintainers before public disclosure.

## Sensitive Data

- Do not commit Supabase service-role keys.
- Do not expose server-only credentials through `NEXT_PUBLIC_*`.
- Avoid uploading photos that intentionally capture faces, license plates, or private areas.

## Supported Reports

Report:

- Auth or session handling issues.
- RLS bypasses.
- Public exposure of private storage files.
- Unsafe photo or moderation flows.
- Dependency vulnerabilities with a practical exploit path.

## Phase 1 Notes

This foundation includes RLS policies and storage setup, but production maintainers must verify policies against real Supabase roles before launch.
