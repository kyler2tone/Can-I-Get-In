import { describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const getUser = vi.fn();
const maybeSingle = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
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
  })),
}));

describe("auth callback route", () => {
  it("exchanges the code and redirects incomplete profiles to onboarding", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });
    maybeSingle.mockResolvedValueOnce({ data: { profile_completed: false } });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("https://canigetin.app/auth/callback?code=abc") as never,
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.headers.get("location")).toBe("https://canigetin.app/onboarding/profile");
  });

  it("redirects callback exchange errors to login", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: new Error("bad code") });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("https://canigetin.app/auth/callback?code=bad") as never,
    );

    expect(response.headers.get("location")).toContain("https://canigetin.app/auth/login");
  });
});
