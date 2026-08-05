import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSiteUrl, normalizeCallbackNext } from "@/lib/auth-urls";
import { getCallbackErrorDestination, getPostAuthDestination } from "@/lib/auth-callback";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeCallbackNext(requestUrl.searchParams.get("next"));
  const authType = requestUrl.searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(new URL(getCallbackErrorDestination("No sign-in code was provided."), getSiteUrl()));
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(getCallbackErrorDestination(), getSiteUrl()));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return NextResponse.redirect(
    new URL(getPostAuthDestination({ profile, requestedNext: next, authType }), getSiteUrl()),
  );
}
