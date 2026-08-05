import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { completeProfileSchema } from "@/lib/validation";

function safeNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

function redirectWithError(request: NextRequest, message: string, next: string) {
  const url = new URL("/onboarding/profile", request.url);
  url.searchParams.set("error", message);
  url.searchParams.set("next", next);
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
  const next = safeNext(formData.get("next"));
  const parsed = completeProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
  });

  if (!parsed.success) {
    return redirectWithError(request, parsed.error.issues[0].message, next);
  }

  const { error } = await supabase.rpc("complete_profile", {
    candidate_username: parsed.data.username,
    candidate_display_name: parsed.data.displayName,
  });

  if (error) {
    return redirectWithError(request, error.message, next);
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/account");
  return NextResponse.redirect(new URL(next, request.url));
}
