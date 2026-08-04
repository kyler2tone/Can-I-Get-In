import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSiteUrl, normalizeCallbackNext } from "@/lib/auth-urls";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeCallbackNext(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?message=${encodeURIComponent("That sign-in link is invalid or expired.")}`, getSiteUrl()),
      );
    }
  }

  return NextResponse.redirect(new URL(next, getSiteUrl()));
}
