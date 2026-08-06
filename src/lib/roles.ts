import { redirect } from "next/navigation";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import type { ProfileRole } from "@/lib/types";

export const studioRoles = new Set<ProfileRole>(["moderator", "admin"]);

export function canAccessStudio(role?: ProfileRole | null) {
  return role ? studioRoles.has(role) : false;
}

export async function requireStudioAccess() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!canAccessStudio(profile?.role)) {
    redirect("/dashboard");
  }

  return profile!;
}
