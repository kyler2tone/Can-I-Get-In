import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSiteUrl, normalizeCallbackNext } from "@/lib/auth-urls";
import { getCallbackErrorDestination, getPostAuthDestination } from "@/lib/auth-callback";
import {
  isPasswordRecoveryIntent,
  passwordRecoveryIntentCookie,
  passwordRecoveryIntentMaxAge,
  passwordRecoveryIntentValue,
} from "@/lib/password-recovery";

type ScheduledCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function createCallbackSupabaseClient(request: NextRequest, scheduledCookies: ScheduledCookie[]) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((cookie) => scheduledCookies.push(cookie));
        },
      },
    },
  );
}

function redirectWithScheduledCookies(
  destination: string,
  scheduledCookies: ScheduledCookie[],
  options: { recoveryIntent?: boolean } = {},
) {
  const response = NextResponse.redirect(new URL(destination, getSiteUrl()));

  scheduledCookies.forEach(({ name, value, options }) => {
    const safeOptions = { ...options };
    delete safeOptions.domain;
    response.cookies.set(name, value, {
      ...safeOptions,
      path: safeOptions.path ?? "/",
    });
  });

  if (options.recoveryIntent) {
    response.cookies.set(passwordRecoveryIntentCookie, passwordRecoveryIntentValue, {
      httpOnly: true,
      maxAge: passwordRecoveryIntentMaxAge,
      path: "/auth/reset-password",
      sameSite: "lax",
      secure: getSiteUrl().startsWith("https://"),
    });
  }

  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeCallbackNext(requestUrl.searchParams.get("next"));
  const authType = requestUrl.searchParams.get("type");
  const intent = requestUrl.searchParams.get("intent");
  const recoveryIntent = isPasswordRecoveryIntent(intent) || isPasswordRecoveryIntent(authType);
  const scheduledCookies: ScheduledCookie[] = [];

  if (!code) {
    const destination = getCallbackErrorDestination("No sign-in code was provided.");
    return redirectWithScheduledCookies(destination, scheduledCookies);
  }

  const supabase = createCallbackSupabaseClient(request, scheduledCookies);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const destination = getCallbackErrorDestination();
    return redirectWithScheduledCookies(destination, scheduledCookies);
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

  const destination = getPostAuthDestination({
    profile,
    requestedNext: next,
    authType: recoveryIntent ? "recovery" : authType,
  });
  return redirectWithScheduledCookies(destination, scheduledCookies, { recoveryIntent });
}
