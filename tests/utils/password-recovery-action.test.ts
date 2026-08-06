import { beforeEach, describe, expect, it, vi } from "vitest";

const resetPasswordForEmail = vi.fn();
const signUp = vi.fn();
const updateUser = vi.fn();
const getUser = vi.fn();
const requireUser = vi.fn();
const cookieGet = vi.fn();
const cookieDelete = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookieGet,
    delete: cookieDelete,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/auth", () => ({
  requireUser,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser,
      resetPasswordForEmail,
      signUp,
      updateUser,
    },
  })),
}));

function resetForm({
  password = "StrongerPass1!",
  confirmPassword = "StrongerPass1!",
}: {
  password?: string;
  confirmPassword?: string;
} = {}) {
  const formData = new FormData();
  formData.set("password", password);
  formData.set("confirmPassword", confirmPassword);
  return formData;
}

describe("password recovery actions", () => {
  beforeEach(() => {
    resetPasswordForEmail.mockReset();
    signUp.mockReset();
    updateUser.mockReset();
    getUser.mockReset();
    requireUser.mockReset();
    cookieGet.mockReset();
    cookieDelete.mockReset();
    resetPasswordForEmail.mockResolvedValue({ error: null });
    signUp.mockResolvedValue({ error: null });
    updateUser.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    requireUser.mockResolvedValue({ id: "user-1" });
    cookieGet.mockReturnValue({ value: "1" });
    process.env.NEXT_PUBLIC_SITE_URL = "https://canigetin.app";
  });

  it("sends recovery emails to the auth callback with recovery intent", async () => {
    const formData = new FormData();
    formData.set("email", "person@example.com");

    const { forgotPasswordAction } = await import("@/lib/actions");
    const result = await forgotPasswordAction({ status: "idle", message: "" }, formData);

    expect(resetPasswordForEmail).toHaveBeenCalledWith("person@example.com", {
      redirectTo: "https://canigetin.app/auth/callback?intent=recovery",
    });
    expect(result.status).toBe("success");
  });

  it("rejects mismatched reset passwords", async () => {
    const { resetPasswordAction } = await import("@/lib/actions");
    const result = await resetPasswordAction(
      { status: "idle", message: "" },
      resetForm({ confirmPassword: "different-password" }),
    );

    expect(result).toEqual({ status: "error", message: "Passwords do not match." });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("updates the password when a recovery session is valid", async () => {
    const { resetPasswordAction } = await import("@/lib/actions");
    const result = await resetPasswordAction({ status: "idle", message: "" }, resetForm());

    expect(getUser).toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith({ password: "StrongerPass1!" });
    expect(cookieDelete).toHaveBeenCalledWith("cigi-password-recovery");
    expect(result).toEqual({
      status: "success",
      message: "Your password has been updated. Redirecting...",
    });
  });

  it("rejects reset attempts without recovery intent", async () => {
    cookieGet.mockReturnValue(undefined);

    const { resetPasswordAction } = await import("@/lib/actions");
    const result = await resetPasswordAction({ status: "idle", message: "" }, resetForm());

    expect(result.status).toBe("error");
    expect(result.message).toContain("invalid or expired");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects weak recovery passwords before calling Supabase", async () => {
    const { resetPasswordAction } = await import("@/lib/actions");
    const result = await resetPasswordAction(
      { status: "idle", message: "" },
      resetForm({ password: "111111111", confirmPassword: "111111111" }),
    );

    expect(result).toEqual({ status: "error", message: "At least 12 characters" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("uses the same policy for signup passwords", async () => {
    const formData = new FormData();
    formData.set("email", "person@example.com");
    formData.set("password", "111111111");
    formData.set("confirmPassword", "111111111");

    const { signupAction } = await import("@/lib/actions");
    const result = await signupAction({ status: "idle", message: "" }, formData);

    expect(result).toEqual({ status: "error", message: "At least 12 characters" });
    expect(signUp).not.toHaveBeenCalled();
  });

  it("uses the same policy for account password changes", async () => {
    const { updateAccountPasswordAction } = await import("@/lib/actions");
    const result = await updateAccountPasswordAction(
      { status: "idle", message: "" },
      resetForm({ password: "111111111", confirmPassword: "111111111" }),
    );

    expect(result).toEqual({ status: "error", message: "At least 12 characters" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("updates account passwords when the shared policy passes", async () => {
    const { updateAccountPasswordAction } = await import("@/lib/actions");
    const result = await updateAccountPasswordAction(
      { status: "idle", message: "" },
      resetForm(),
    );

    expect(requireUser).toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith({ password: "StrongerPass1!" });
    expect(result).toEqual({
      status: "success",
      message: "Your password has been updated.",
    });
  });

  it("rejects expired recovery sessions", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });

    const { resetPasswordAction } = await import("@/lib/actions");
    const result = await resetPasswordAction({ status: "idle", message: "" }, resetForm());

    expect(result.status).toBe("error");
    expect(result.message).toContain("invalid or expired");
    expect(updateUser).not.toHaveBeenCalled();
  });
});
