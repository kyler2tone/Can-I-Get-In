import { describe, expect, it, vi } from "vitest";

const signOut = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signOut,
    },
  })),
}));

describe("auth logout route", () => {
  it("signs out through the server Supabase client and redirects home", async () => {
    signOut.mockResolvedValueOnce({ error: null });

    const { GET } = await import("@/app/auth/logout/route");
    const response = await GET(new Request("https://canigetin.app/auth/logout") as never);

    expect(signOut).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://canigetin.app/");
  });
});
