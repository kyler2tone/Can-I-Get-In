import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const rpc = vi.fn();
const signOut = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser,
      signOut,
    },
    rpc,
  })),
}));

function completionRequest(body: URLSearchParams) {
  return new Request("https://canigetin.app/onboarding/profile/complete", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

describe("profile completion route", () => {
  beforeEach(() => {
    getUser.mockReset();
    rpc.mockReset();
    signOut.mockReset();
  });

  it("redirects unauthenticated submissions to login", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });

    const { POST } = await import("@/app/onboarding/profile/complete/route");
    const response = await POST(
      completionRequest(
        new URLSearchParams({
          displayName: "New Contributor",
          username: "rapid-helper",
          next: "/dashboard",
        }),
      ) as never,
    );

    expect(response.headers.get("location")).toBe(
      "https://canigetin.app/auth/login?message=Please+sign+in+to+continue.",
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it("completes the authenticated user's profile and redirects to dashboard", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });
    rpc.mockResolvedValueOnce({ error: null });

    const { POST } = await import("@/app/onboarding/profile/complete/route");
    const response = await POST(
      completionRequest(
        new URLSearchParams({
          displayName: "Rapid Helper",
          username: "Rapid-Helper",
          next: "/dashboard",
        }),
      ) as never,
    );

    expect(getUser).toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("complete_profile", {
      candidate_display_name: "Rapid Helper",
      candidate_username: "rapid-helper",
    });
    expect(signOut).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://canigetin.app/dashboard");
  });

  it("returns validation errors without logging the user out", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });

    const { POST } = await import("@/app/onboarding/profile/complete/route");
    const response = await POST(
      completionRequest(
        new URLSearchParams({
          displayName: "Rapid Helper",
          username: "admin",
          next: "/dashboard",
        }),
      ) as never,
    );

    expect(response.headers.get("location")).toContain("/onboarding/profile?error=");
    expect(rpc).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("returns RPC errors without logging the user out", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });
    rpc.mockResolvedValueOnce({ error: new Error("That username is not available.") });

    const { POST } = await import("@/app/onboarding/profile/complete/route");
    const response = await POST(
      completionRequest(
        new URLSearchParams({
          displayName: "Rapid Helper",
          username: "rapid-helper",
          next: "/dashboard",
        }),
      ) as never,
    );

    expect(response.headers.get("location")).toContain("/onboarding/profile?error=");
    expect(signOut).not.toHaveBeenCalled();
  });
});
