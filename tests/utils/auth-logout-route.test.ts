import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signOut,
    },
  })),
}));

describe("auth logout route", () => {
  beforeEach(() => {
    signOut.mockReset();
  });

  it("does not sign out on GET requests", async () => {
    const { GET } = await import("@/app/auth/logout/route");
    const response = await GET();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("does not sign out when navigation prefetches the logout route", async () => {
    const { GET } = await import("@/app/auth/logout/route");
    const response = await GET();

    expect(response.status).toBe(405);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out through POST and redirects home", async () => {
    signOut.mockResolvedValueOnce({ error: null });

    const { POST } = await import("@/app/auth/logout/route");
    const response = await POST(
      new Request("https://canigetin.app/auth/logout", { method: "POST" }) as never,
    );

    expect(signOut).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://canigetin.app/");
  });
});
