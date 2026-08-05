import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const redirect = vi.fn();
const adminUpdate = vi.fn();
const adminEq = vi.fn();
const deleteUser = vi.fn();
const signOut = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/auth", () => ({
  requireUser,
}));

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
      signOut,
    },
  })),
}));

function deleteForm(confirmation: string) {
  const formData = new FormData();
  formData.set("confirmation", confirmation);
  return formData;
}

describe("account deletion action", () => {
  beforeEach(() => {
    requireUser.mockReset();
    redirect.mockReset();
    adminUpdate.mockReset();
    adminEq.mockReset();
    deleteUser.mockReset();
    signOut.mockReset();
    adminUpdate.mockReturnValue({ eq: adminEq });
    adminEq.mockResolvedValue({ error: null });
    deleteUser.mockResolvedValue({ error: null });
    redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("rejects account deletion without confirmation", async () => {
    requireUser.mockResolvedValueOnce({ id: "user-12345678" });

    const { deleteAccountAction } = await import("@/lib/actions");
    const result = await deleteAccountAction({ status: "idle", message: "" }, deleteForm("NOPE"));

    expect(result).toEqual({ status: "error", message: "Type DELETE to confirm account deletion." });
    expect(deleteUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("restores the form with an error if profile cleanup fails", async () => {
    requireUser.mockResolvedValueOnce({ id: "user-12345678" });
    adminEq.mockResolvedValueOnce({ error: new Error("cleanup failed") });

    const { deleteAccountAction } = await import("@/lib/actions");
    const result = await deleteAccountAction({ status: "idle", message: "" }, deleteForm("DELETE"));

    expect(result).toEqual({ status: "error", message: "cleanup failed" });
    expect(deleteUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("deletes the auth user, signs out, and redirects on success", async () => {
    requireUser.mockResolvedValueOnce({ id: "user-12345678" });

    const { deleteAccountAction } = await import("@/lib/actions");

    await expect(
      deleteAccountAction({ status: "idle", message: "" }, deleteForm("DELETE")),
    ).rejects.toThrow("REDIRECT:/?message=Your account has been deleted.");

    expect(deleteUser).toHaveBeenCalledWith("user-12345678", true);
    expect(signOut).toHaveBeenCalled();
  });
});

