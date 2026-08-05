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

function getDiagnosticCookieNames(request: NextRequest) {
  return (request.headers.get("cookie") ?? "")
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((name) => name.startsWith("sb-"));
}

function logProfileCompletionDiagnostic(
  event: string,
  request: NextRequest,
  details: Record<string, unknown> = {},
) {
  console.info("[profile-completion]", {
    event,
    requestHost: request.headers.get("host"),
    hasCookieHeader: Boolean(request.headers.get("cookie")),
    supabaseCookieNames: getDiagnosticCookieNames(request),
    ...details,
  });
}

export async function POST(request: NextRequest) {
  logProfileCompletionDiagnostic("request_received", request);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  logProfileCompletionDiagnostic("auth_get_user_result", request, {
    authReturnedUser: Boolean(user),
    authGetUserErrorMessage: getUserError?.message ?? null,
    authGetUserErrorCode: getUserError?.code ?? null,
  });

  if (!user) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("message", "Please sign in to continue.");
    logProfileCompletionDiagnostic("redirecting", request, {
      completeProfileReached: false,
      finalRedirectDestination: url.pathname,
    });
    return NextResponse.redirect(url);
  }

  const formData = await request.formData();
  const next = safeNext(formData.get("next"));
  const parsed = completeProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
  });

  if (!parsed.success) {
    logProfileCompletionDiagnostic("redirecting", request, {
      completeProfileReached: false,
      finalRedirectDestination: "/onboarding/profile",
    });
    return redirectWithError(request, parsed.error.issues[0].message, next);
  }

  logProfileCompletionDiagnostic("complete_profile_reached", request, {
    completeProfileReached: true,
  });

  const { error } = await supabase.rpc("complete_profile", {
    candidate_username: parsed.data.username,
    candidate_display_name: parsed.data.displayName,
  });

  if (error) {
    logProfileCompletionDiagnostic("redirecting", request, {
      completeProfileReached: true,
      finalRedirectDestination: "/onboarding/profile",
    });
    return redirectWithError(request, error.message, next);
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/account");
  logProfileCompletionDiagnostic("redirecting", request, {
    completeProfileReached: true,
    finalRedirectDestination: next,
  });
  return NextResponse.redirect(new URL(next, request.url));
}
