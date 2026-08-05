import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const adminUpdate = vi.fn();
const adminEq = vi.fn();
const deleteUser = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: adminUpdate,
    })),
    auth: {
      admin: {
        deleteUser,
      },
    },
  })),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser,
      signOut,
    },
  })),
}));

function deleteRequest(confirmation: string) {
  const formData = new FormData();
  formData.set("confirmation", confirmation);

  return new Request("https://canigetin.app/settings/account/delete", {
    method: "POST",
    body: formData,
  });
}

describe("account delete route", () => {
  beforeEach(() => {
    getUser.mockReset();
    adminUpdate.mockReset();
    adminEq.mockReset();
    deleteUser.mockReset();
    signOut.mockReset();
    adminUpdate.mockReturnValue({ eq: adminEq });
    adminEq.mockResolvedValue({ error: null });
    deleteUser.mockResolvedValue({ error: null });
  });

  it("redirects unauthenticated deletion requests to login", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });

    const { POST } = await import("@/app/settings/account/delete/route");
    const response = await POST(deleteRequest("DELETE") as never);

    expect(response.headers.get("location")).toBe(
      "https://canigetin.app/auth/login?message=Please+sign+in+to+continue.",
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("redirects back with an error without confirmation", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-12345678" } } });

    const { POST } = await import("@/app/settings/account/delete/route");
    const response = await POST(deleteRequest("NOPE") as never);

    expect(response.headers.get("location")).toBe(
      "https://canigetin.app/settings/account?deleteError=Type+DELETE+to+confirm+account+deletion.",
    );
    expect(deleteUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("redirects back with an error if profile cleanup fails", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-12345678" } } });
    adminEq.mockResolvedValueOnce({ error: new Error("cleanup failed") });

    const { POST } = await import("@/app/settings/account/delete/route");
    const response = await POST(deleteRequest("DELETE") as never);

    expect(response.headers.get("location")).toBe(
      "https://canigetin.app/settings/account?deleteError=cleanup+failed",
    );
    expect(deleteUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("deletes the auth user, signs out, and redirects home on success", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-12345678" } } });

    const { POST } = await import("@/app/settings/account/delete/route");
    const response = await POST(deleteRequest("DELETE") as never);

    expect(adminUpdate).toHaveBeenCalledWith({
      display_name: "Former Contributor",
      username: "deleted-user-123",
      avatar_url: null,
      bio: null,
      city: null,
      state: null,
      profile_completed: false,
      deleted_at: expect.any(String),
    });
    expect(deleteUser).toHaveBeenCalledWith("user-12345678", true);
    expect(signOut).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://canigetin.app/?message=Your%20account%20has%20been%20deleted.",
    );
  });
});

