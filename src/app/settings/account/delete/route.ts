import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSupabaseServerClient } from "@/lib/supabase";

function redirectToAccount(request: NextRequest, message: string) {
  const url = new URL("/settings/account", request.url);
  url.searchParams.set("deleteError", message);
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("message", "Please sign in to continue.");
    return NextResponse.redirect(url);
  }

  const formData = await request.formData();

  if (formData.get("confirmation") !== "DELETE") {
    return redirectToAccount(request, "Type DELETE to confirm account deletion.");
  }

  const admin = getSupabaseAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      display_name: "Former Contributor",
      username: `deleted-${user.id.slice(0, 8)}`,
      avatar_url: null,
      bio: null,
      city: null,
      state: null,
      profile_completed: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return redirectToAccount(request, profileError.message || "Account deletion could not be completed.");
  }

  const { error } = await admin.auth.admin.deleteUser(user.id, true);

  if (error) {
    return redirectToAccount(request, error.message || "Account deletion could not be completed.");
  }

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/?message=Your account has been deleted.", request.url));
}

