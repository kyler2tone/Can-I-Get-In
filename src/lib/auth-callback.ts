export type CallbackProfile = {
  profile_completed?: boolean | null;
} | null;

export function getPostAuthDestination({
  profile,
  requestedNext,
  authType,
}: {
  profile: CallbackProfile;
  requestedNext?: string | null;
  authType?: string | null;
}) {
  if (authType === "recovery") {
    return "/auth/reset-password";
  }

  if (!profile?.profile_completed) {
    return "/onboarding/profile";
  }

  if (requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")) {
    return requestedNext;
  }

  return "/dashboard";
}

export function getCallbackErrorDestination(message = "That sign-in link is invalid or expired.") {
  return `/auth/login?message=${encodeURIComponent(message)}`;
}
