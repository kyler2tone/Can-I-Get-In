import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { completeProfileSchema } from "@/lib/validation";

function safeNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

function friendlyProfileError(message: string) {
  if (message === "That username is not available.") return "Username already taken.";
  return message;
}

function redirectWithError(
  request: NextRequest,
  message: string,
  next: string,
  values: { displayName?: string; username?: string } = {},
) {
  const url = new URL("/onboarding/profile", request.url);
  url.searchParams.set("error", friendlyProfileError(message));
  url.searchParams.set("next", next);
  if (values.displayName) url.searchParams.set("displayName", values.displayName);
  if (values.username) url.searchParams.set("username", values.username);
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
  const displayName = formData.get("displayName");
  const username = formData.get("username");
  const values = {
    displayName: typeof displayName === "string" ? displayName : "",
    username: typeof username === "string" ? username : "",
  };
  const parsed = completeProfileSchema.safeParse({
    displayName: values.displayName,
    username: values.username,
  });

  if (!parsed.success) {
    return redirectWithError(request, parsed.error.issues[0].message, next, values);
  }

  const { error } = await supabase.rpc("complete_profile", {
    candidate_username: parsed.data.username,
    candidate_display_name: parsed.data.displayName,
  });

  if (error) {
    return redirectWithError(request, error.message, next, values);
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/account");
  return NextResponse.redirect(new URL(next, request.url));
}
