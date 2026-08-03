import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?message=Please sign in to continue.");
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
      "id, display_name, username, avatar_url, bio, city, state, role, points, contribution_count, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  return data;
}
