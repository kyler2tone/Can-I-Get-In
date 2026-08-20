import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  remove: vi.fn(),
  analyzePlaceAccessibility: vi.fn(),
  deleteFn: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
    from: mocks.from,
    storage: {
      from: vi.fn(() => ({
        remove: mocks.remove,
      })),
    },
  })),
}));

vi.mock("@/lib/openai-accessibility", () => ({
  analyzePlaceAccessibility: mocks.analyzePlaceAccessibility,
}));

describe("photo deletion route", () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.getUser.mockReset();
    mocks.remove.mockReset();
    mocks.analyzePlaceAccessibility.mockReset();
    mocks.deleteFn.mockReset();
    mocks.eq.mockReset();
    mocks.select.mockReset();
    mocks.maybeSingle.mockReset();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.maybeSingle
      .mockResolvedValueOnce({
        data: {
          role: "contributor",
          profile_completed: true,
        },
        error: null,
      })
      .mockResolvedValueOnce({
      data: {
        id: "photo-1",
        place_id: "place-1",
        uploader_id: "user-1",
        storage_path: "place-photos/place-1/user-1/photo.webp",
        moderation_status: "approved",
      },
      error: null,
      });
    mocks.deleteFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mocks.from.mockReturnValue({ select: mocks.select, delete: mocks.deleteFn });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.analyzePlaceAccessibility.mockResolvedValue({ status: "completed" });
  });

  it("allows owners to delete their photos and re-analyzes approved evidence", async () => {
    const { POST } = await import("@/app/api/photos/delete/route");
    const response = await POST(
      new Request("https://canigetin.app/api/photos/delete", {
        method: "POST",
        body: JSON.stringify({ photoId: "photo-1" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.deleteFn).toHaveBeenCalled();
    expect(mocks.remove).toHaveBeenCalledWith(["place-1/user-1/photo.webp"]);
    expect(mocks.analyzePlaceAccessibility).toHaveBeenCalledWith("place-1");
  });

  it("does not delete the database record when storage deletion fails", async () => {
    mocks.remove.mockResolvedValueOnce({ error: { message: "Storage denied" } });
    const { POST } = await import("@/app/api/photos/delete/route");
    const response = await POST(
      new Request("https://canigetin.app/api/photos/delete", {
        method: "POST",
        body: JSON.stringify({ photoId: "photo-1" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.deleteFn).not.toHaveBeenCalled();
  });

  it("does not allow deleting another contributor's photo", async () => {
    mocks.maybeSingle.mockReset();
    mocks.maybeSingle
      .mockResolvedValueOnce({
        data: {
          role: "contributor",
          profile_completed: true,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "photo-1",
          place_id: "place-1",
          uploader_id: "user-2",
          storage_path: "place-photos/place-1/user-2/photo.webp",
          moderation_status: "approved",
        },
        error: null,
      });
    const { POST } = await import("@/app/api/photos/delete/route");
    const response = await POST(
      new Request("https://canigetin.app/api/photos/delete", {
        method: "POST",
        body: JSON.stringify({ photoId: "photo-1" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.deleteFn).not.toHaveBeenCalled();
  });

  it("returns a JSON sign-in error instead of redirecting for API deletion", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import("@/app/api/photos/delete/route");
    const response = await POST(
      new Request("https://canigetin.app/api/photos/delete", {
        method: "POST",
        body: JSON.stringify({ photoId: "photo-1" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.message).toBe("Please sign in before deleting photos.");
    expect(mocks.deleteFn).not.toHaveBeenCalled();
  });
});
