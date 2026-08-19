import { SiteHeaderClient } from "@/components/site-header-client";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { canAccessStudio } from "@/lib/roles";

export async function SiteHeader({ sticky = true }: { sticky?: boolean }) {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  const displayName = profile?.display_name ?? user?.email ?? "Contributor";
  const initials = initialsFor(displayName);

  return (
    <SiteHeaderClient
      sticky={sticky}
      profile={
        user
          ? {
              displayName,
              initials,
              avatarUrl: profile?.avatar_url ?? null,
              username: profile?.username ?? null,
              canAccessStudio: canAccessStudio(profile?.role),
            }
          : null
      }
    />
  );
}

function initialsFor(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "CI";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
