import { redirect } from "next/navigation";
import { canContributePhotos } from "@/lib/account";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(next?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const params = new URLSearchParams({ message: "Please sign in to continue." });

    if (next) {
      params.set("next", next);
    }

    redirect(`/auth/login?${params.toString()}`);
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, display_name, username, avatar_url, bio, city, state, role, points, contribution_count, profile_completed, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

export async function requireCompletedProfile(next?: string) {
  const user = await requireUser(next);
  const profile = await getCurrentProfile();

  if (!canContributePhotos(profile)) {
    const returnTo = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/onboarding/profile${returnTo}`);
  }

  return { user, profile };
}
