import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  moderatePlacePhoto: vi.fn(),
  shouldAutoApprove: vi.fn(),
  analyzePlaceAccessibility: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
    storage: { from: mocks.storageFrom },
  })),
}));

vi.mock("@/lib/openai-photo-moderation", () => ({
  moderatePlacePhoto: mocks.moderatePlacePhoto,
  shouldAutoApprovePhotoModeration: mocks.shouldAutoApprove,
}));

vi.mock("@/lib/openai-accessibility", () => ({
  analyzePlaceAccessibility: mocks.analyzePlaceAccessibility,
}));

describe("photo auto-moderation route", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.moderatePlacePhoto.mockResolvedValue({
      decision: "approve",
      confidence: 0.9,
      place_photo_valid: true,
      category_match: true,
      reason: "Valid place photo.",
    });
    mocks.shouldAutoApprove.mockReturnValue(true);
    mocks.analyzePlaceAccessibility.mockResolvedValue({ status: "succeeded" });
    mocks.storageFrom.mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/photo.webp" } }),
    });
    mocks.from.mockImplementation((table: string) => {
      if (table === "place_photos") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "11111111-1111-4111-8111-111111111111",
                  place_id: "place-1",
                  uploader_id: "user-1",
                  storage_path: "place-photos/place-1/user-1/photo.webp",
                  category: "entrance_overview",
                  moderation_status: "pending",
                },
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          })),
        };
      }
      return {};
    });
  });

  it("auto-approves high-confidence valid photos", async () => {
    const { POST } = await import("@/app/api/photos/moderate/route");
    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "approved" });
    expect(mocks.moderatePlacePhoto).toHaveBeenCalled();
  });

  it("leaves ambiguous photos pending for human review", async () => {
    mocks.shouldAutoApprove.mockReturnValue(false);

    const { POST } = await import("@/app/api/photos/moderate/route");
    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "pending" });
  });

  it("falls back to pending human review when AI moderation fails", async () => {
    mocks.moderatePlacePhoto.mockRejectedValue(new Error("OpenAI unavailable"));

    const { POST } = await import("@/app/api/photos/moderate/route");
    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "pending" });
  });
});

function request() {
  return new Request("https://canigetin.app/api/photos/moderate", {
    method: "POST",
    body: JSON.stringify({ photoId: "11111111-1111-4111-8111-111111111111" }),
  });
}
