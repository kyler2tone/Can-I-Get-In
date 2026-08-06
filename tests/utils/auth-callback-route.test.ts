import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const getUser = vi.fn();
const maybeSingle = vi.fn();
const createServerClient = vi.fn();

vi.mock("@supabase/ssr", async () => {
  const actual = await vi.importActual<typeof import("@supabase/ssr")>("@supabase/ssr");

  return {
    ...actual,
    createServerClient,
  };
});

function setSupabaseMock({
  exchangeError = null,
  profileCompleted = false,
  scheduledCookies = [
    {
      name: "sb-project-auth-token",
      value: "chunk-1",
      options: { httpOnly: true, sameSite: "lax" as const },
    },
    {
      name: "sb-project-auth-token.0",
      value: "chunk-2",
      options: { httpOnly: true, sameSite: "lax" as const },
    },
  ],
}: {
  exchangeError?: Error | null;
  profileCompleted?: boolean;
  scheduledCookies?: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }>;
} = {}) {
  exchangeCodeForSession.mockImplementationOnce(async () => {
    cookieAdapter?.setAll(scheduledCookies);
    return { error: exchangeError };
  });
  getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });
  maybeSingle.mockResolvedValueOnce({ data: { profile_completed: profileCompleted } });
}

let cookieAdapter:
  | {
      getAll: () => unknown[];
      setAll: (
        cookies: Array<{
          name: string;
          value: string;
          options: Record<string, unknown>;
        }>,
      ) => void;
    }
  | null = null;

createServerClient.mockImplementation((_url, _key, options) => {
  cookieAdapter = options.cookies;

  return {
    auth: {
      exchangeCodeForSession,
      getUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle,
        })),
      })),
    })),
  };
});

function getSetCookieHeaders(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  return headers.getSetCookie?.() ?? [headers.get("set-cookie") ?? ""].filter(Boolean);
}

describe("auth callback route", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    getUser.mockReset();
    maybeSingle.mockReset();
    createServerClient.mockClear();
    cookieAdapter = null;
  });

  it("exchanges the code and redirects incomplete profiles to onboarding", async () => {
    setSupabaseMock({ profileCompleted: false });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest("https://canigetin.app/auth/callback?code=abc"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.headers.get("location")).toBe("https://canigetin.app/onboarding/profile");
  });

  it("preserves multiple Supabase Set-Cookie headers on the redirect response", async () => {
    setSupabaseMock({ profileCompleted: true });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest("https://canigetin.app/auth/callback?code=abc"),
    );
    const setCookies = getSetCookieHeaders(response).join("\n");

    expect(setCookies).toContain("sb-project-auth-token=");
    expect(setCookies).toContain("sb-project-auth-token.0=");
    expect(setCookies).toContain("Path=/");
  });

  it("redirects completed profiles to dashboard with session cookies", async () => {
    setSupabaseMock({ profileCompleted: true });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest("https://canigetin.app/auth/callback?code=abc"),
    );

    expect(response.headers.get("location")).toBe("https://canigetin.app/dashboard");
    expect(getSetCookieHeaders(response).length).toBeGreaterThanOrEqual(1);
  });

  it("redirects recovery callbacks to reset password with recovery intent", async () => {
    setSupabaseMock({ profileCompleted: true });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest("https://canigetin.app/auth/callback?code=abc&intent=recovery"),
    );
    const setCookies = getSetCookieHeaders(response).join("\n");

    expect(response.headers.get("location")).toBe("https://canigetin.app/auth/reset-password");
    expect(setCookies).toContain("cigi-password-recovery=1");
    expect(setCookies).toContain("Path=/auth/reset-password");
  });

  it("redirects callback exchange errors to login", async () => {
    setSupabaseMock({ exchangeError: new Error("bad code"), scheduledCookies: [] });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new NextRequest("https://canigetin.app/auth/callback?code=bad"),
    );

    expect(response.headers.get("location")).toContain("https://canigetin.app/auth/login");
    expect(getSetCookieHeaders(response)).toEqual([]);
  });
});
