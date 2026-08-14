export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://canigetin.app";
}

export function getAuthCallbackUrl(next = "/dashboard") {
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function getAuthExchangeCallbackUrl(next?: string) {
  const safeNext = next ? normalizeCallbackNext(next) : "";
  const nextParam = safeNext ? `?next=${encodeURIComponent(safeNext)}` : "";

  return `${getSiteUrl()}/auth/callback${nextParam}`;
}

export function getPasswordRecoveryCallbackUrl() {
  return `${getSiteUrl()}/auth/callback?intent=recovery`;
}

export function normalizeCallbackNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
