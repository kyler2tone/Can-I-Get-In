import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { canAccessStudio } from "@/lib/roles";
import type { StudioPhoto } from "@/lib/studio";

const mocks = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  from: vi.fn(),
  getCurrentProfile: vi.fn(),
  getUser: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth", () => ({
  getCurrentProfile: mocks.getCurrentProfile,
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
    from: mocks.from,
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mocks.createSignedUrl,
      })),
    },
  })),
}));

const pendingPhoto: StudioPhoto = {
  id: "photo-1",
  placeId: "place-1",
  placeName: "Main Street Cafe",
  placeSlug: "main-street-cafe",
  placeAddress: "123 Main Street",
  contributorName: "Rapid Helper",
  contributorUsername: "rapid-helper",
  category: "entrance_overview",
  categoryLabel: "Entrance Overview",
  status: "pending",
  uploadedAt: "2026-08-06T12:00:00.000Z",
  reviewedBy: null,
  reviewedAt: null,
  signedUrl: "https://example.com/photo.jpg",
};

describe("studio roles", () => {
  it("does not allow contributors to access Studio", () => {
    expect(canAccessStudio("contributor")).toBe(false);
  });

  it("allows moderators and admins to access Studio", () => {
    expect(canAccessStudio("moderator")).toBe(true);
    expect(canAccessStudio("admin")).toBe(true);
  });
});

describe("photo moderation queue", () => {
  it("renders pending photos with moderation actions", async () => {
    const { PhotoModerationQueue } = await import("@/components/studio/photo-moderation-queue");

    render(<PhotoModerationQueue photos={[pendingPhoto]} />);

    expect(screen.getByText("Main Street Cafe")).toBeInTheDocument();
    expect(screen.getByText("Entrance Overview")).toBeInTheDocument();
    expect(screen.getByText("Rapid Helper")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("shows a useful empty state", async () => {
    const { PhotoModerationQueue } = await import("@/components/studio/photo-moderation-queue");

    render(<PhotoModerationQueue photos={[]} />);

    expect(screen.getByText("No photos are awaiting review.")).toBeInTheDocument();
  });
});

describe("studio photo data", () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.getUser.mockReset();
    mocks.createSignedUrl.mockReset();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "moderator-1" } } });
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://example.com/photo.jpg" } });
  });

  it("loads only pending photos for the moderation queue", async () => {
    const query = queryMock({
      data: [
        {
          id: "photo-1",
          place_id: "place-1",
          uploader_id: "user-1",
          storage_path: "place-photos/place-1/user-1/photo.webp",
          category: "entrance_overview",
          moderation_status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          created_at: "2026-08-06T12:00:00.000Z",
        },
      ],
    });
    const places = queryMock({
      data: [
        {
          id: "place-1",
          name: "Main Street Cafe",
          slug: "main-street-cafe",
          address: "123 Main Street",
        },
      ],
    });
    const profiles = queryMock({
      data: [{ id: "user-1", display_name: "Rapid Helper", username: "rapid-helper" }],
    });

    mocks.from
      .mockReturnValueOnce({ select: vi.fn(() => query) })
      .mockReturnValueOnce({ select: vi.fn(() => places) })
      .mockReturnValueOnce({ select: vi.fn(() => profiles) });

    const { getPendingStudioPhotos } = await import("@/lib/studio");
    const photos = await getPendingStudioPhotos();

    expect(query.eq).toHaveBeenCalledWith("moderation_status", "pending");
    expect(photos).toHaveLength(1);
    expect(photos[0].placeName).toBe("Main Street Cafe");
  });

  it("public place photo loading requests approved photos only", async () => {
    const query = queryMock({ data: [] });
    mocks.from.mockReturnValueOnce({ select: vi.fn(() => query) });

    const { getApprovedPlacePhotos } = await import("@/lib/places");
    await getApprovedPlacePhotos("place-1");

    expect(query.eq).toHaveBeenCalledWith("place_id", "place-1");
    expect(query.eq).toHaveBeenCalledWith("moderation_status", "approved");
  });
});

describe("photo moderation actions", () => {
  beforeEach(() => {
    mocks.revalidatePath.mockReset();
    mocks.requireUser.mockReset();
    mocks.getCurrentProfile.mockReset();
    mocks.update.mockReset();
    mocks.updateEq.mockReset();
    mocks.from.mockReset();
    mocks.requireUser.mockResolvedValue({ id: "moderator-1" });
    mocks.getCurrentProfile.mockResolvedValue({ id: "moderator-1", role: "moderator" });
    mocks.update.mockReturnValue({ eq: mocks.updateEq });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ update: mocks.update });
  });

  it("approves photos and records audit fields", async () => {
    const formData = new FormData();
    formData.set("photoId", "photo-1");

    const { approvePhotoAction } = await import("@/lib/studio-actions");
    await approvePhotoAction(formData);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        moderation_status: "approved",
        reviewed_by: "moderator-1",
        reviewed_at: expect.any(String),
      }),
    );
    expect(mocks.updateEq).toHaveBeenCalledWith("id", "photo-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/studio/photos");
  });

  it("rejects photos and keeps them out of public galleries", async () => {
    const formData = new FormData();
    formData.set("photoId", "photo-1");

    const { rejectPhotoAction } = await import("@/lib/studio-actions");
    await rejectPhotoAction(formData);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        moderation_status: "rejected",
        reviewed_by: "moderator-1",
      }),
    );
  });
});

function queryMock(result: { data: unknown[] }) {
  const query = {
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    then(resolve: (value: typeof result) => void) {
      resolve(result);
    },
  };

  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);

  return query;
}
