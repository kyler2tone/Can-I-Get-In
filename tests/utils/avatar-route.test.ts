import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const remove = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser,
    },
    from: vi.fn(() => ({
      update,
    })),
    storage: {
      from: vi.fn(() => ({
        remove,
      })),
    },
  })),
}));

describe("avatar profile route", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    getUser.mockReset();
    update.mockReset();
    eq.mockReset();
    remove.mockReset();
    update.mockReturnValue({ eq });
    eq.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
  });

  it("updates the authenticated user's avatar URL", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });

    const { POST } = await import("@/app/settings/profile/avatar/route");
    const response = await POST(
      new Request("https://canigetin.app/settings/profile/avatar", {
        method: "POST",
        body: JSON.stringify({
          avatarUrl: "https://project.supabase.co/storage/v1/object/public/avatars/user-1/avatar.webp",
        }),
      }) as never,
    );

    expect(update).toHaveBeenCalledWith({
      avatar_url: "https://project.supabase.co/storage/v1/object/public/avatars/user-1/avatar.webp",
    });
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(response.status).toBe(200);
  });

  it("removes the authenticated user's avatar object and profile URL", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });

    const { DELETE } = await import("@/app/settings/profile/avatar/route");
    const response = await DELETE();

    expect(remove).toHaveBeenCalledWith(["user-1/avatar.webp"]);
    expect(update).toHaveBeenCalledWith({ avatar_url: null });
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(response.status).toBe(200);
  });

  it("rejects unauthenticated avatar changes", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });

    const { POST } = await import("@/app/settings/profile/avatar/route");
    const response = await POST(
      new Request("https://canigetin.app/settings/profile/avatar", {
        method: "POST",
        body: JSON.stringify({
          avatarUrl: "https://project.supabase.co/storage/v1/object/public/avatars/user-1/avatar.webp",
        }),
      }) as never,
    );

    expect(update).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});
