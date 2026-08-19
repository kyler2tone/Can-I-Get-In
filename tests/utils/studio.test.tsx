import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { canAccessStudio } from "@/lib/roles";
import type { StudioPhoto, StudioPlace } from "@/lib/studio";

const mocks = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  from: vi.fn(),
  getCurrentProfile: vi.fn(),
  getUser: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  select: vi.fn(),
  selectEq: vi.fn(),
  maybeSingle: vi.fn(),
  analyzePlaceAccessibility: vi.fn(),
  routerRefresh: vi.fn(),
  after: vi.fn((callback: () => void | Promise<void>) => callback()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/server", () => ({
  after: mocks.after,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.routerRefresh,
  }),
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

vi.mock("@/lib/openai-accessibility", () => ({
  analyzePlaceAccessibility: mocks.analyzePlaceAccessibility,
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

const pendingPlace: StudioPlace = {
  id: "place-1",
  name: "Manual Trailhead",
  slug: "manual-trailhead",
  address: "Trailhead near 1st Street",
  category: "Park",
  source: "community_manual",
  status: "pending_review",
  verificationNotes: "Contributor could not find a verified listing.",
  submittedAt: "2026-08-14T12:00:00.000Z",
  contributorName: "Rapid Helper",
  contributorUsername: "rapid-helper",
  photos: [
    {
      id: "photo-1",
      categoryLabel: "Entrance Overview",
      status: "pending",
      signedUrl: "https://example.com/photo.jpg",
    },
  ],
};

const pendingUpdate = {
  id: "update-1",
  placeId: "place-1",
  placeName: "Main Street Cafe",
  placeSlug: "main-street-cafe",
  factors: ["step_free_entrance"],
  suggestedStatus: "unknown",
  explanation: "The doorway photo looks outdated.",
  submittedAt: "2026-08-18T12:00:00.000Z",
  contributorName: "Rapid Helper",
  contributorUsername: "rapid-helper",
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

  it("disables duplicate moderation actions and shows an accessible toast", async () => {
    mocks.requireUser.mockResolvedValue({ id: "moderator-1" });
    mocks.getCurrentProfile.mockResolvedValue({ id: "moderator-1", role: "moderator" });
    mocks.update.mockReturnValue({ eq: mocks.updateEq });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.select.mockReturnValue({ eq: mocks.selectEq });
    mocks.selectEq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.maybeSingle.mockResolvedValue({ data: { place_id: "place-1" } });
    mocks.from.mockReturnValue({ update: mocks.update, select: mocks.select });
    mocks.analyzePlaceAccessibility.mockResolvedValue({ status: "completed" });
    const { PhotoModerationQueue } = await import("@/components/studio/photo-moderation-queue");

    render(<PhotoModerationQueue photos={[pendingPhoto]} />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(screen.getByRole("button", { name: "Approving..." })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Photo approved"));
    expect(screen.queryByText("Main Street Cafe")).not.toBeInTheDocument();
    expect(mocks.routerRefresh).not.toHaveBeenCalled();
  });
});

describe("studio navigation", () => {
  it("shows pending photo count only when there are photos awaiting review", async () => {
    const { StudioNav } = await import("@/components/studio/studio-nav");

    render(<StudioNav pendingPhotoCount={7} />);

    expect(screen.getByLabelText("7 photos awaiting review")).toHaveTextContent("7");
  });
});

describe("place review queue", () => {
  it("renders pending manual places with review actions and submitted photos", async () => {
    const { PlaceReviewQueue } = await import("@/components/studio/place-review-queue");

    render(<PlaceReviewQueue places={[pendingPlace]} />);

    expect(screen.getByText("Manual Trailhead")).toBeInTheDocument();
    expect(screen.getByText("Manual submission")).toBeInTheDocument();
    expect(screen.getByText("Rapid Helper")).toBeInTheDocument();
    expect(screen.getByText(/Contributor could not find/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save and approve" })).toBeInTheDocument();
  });

  it("shows a useful empty state for place review", async () => {
    const { PlaceReviewQueue } = await import("@/components/studio/place-review-queue");

    render(<PlaceReviewQueue places={[]} />);

    expect(screen.getByText("No places are awaiting review.")).toBeInTheDocument();
  });
});

describe("suggested update queue", () => {
  it("renders pending suggested updates with review actions", async () => {
    const { UpdateRequestQueue } = await import("@/components/studio/update-request-queue");

    render(<UpdateRequestQueue updates={[pendingUpdate]} />);

    expect(screen.getByText("Main Street Cafe")).toBeInTheDocument();
    expect(screen.getByText("Step-free entrance")).toBeInTheDocument();
    expect(screen.getByText("The doorway photo looks outdated.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("shows a useful empty state for suggested updates", async () => {
    const { UpdateRequestQueue } = await import("@/components/studio/update-request-queue");

    render(<UpdateRequestQueue updates={[]} />);

    expect(screen.getByText("No suggested updates are awaiting review.")).toBeInTheDocument();
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

  it("loads the Studio pending photo count from moderation data", async () => {
    const query = {
      eq: vi.fn().mockResolvedValue({ count: 7 }),
    };
    mocks.from.mockReturnValueOnce({ select: vi.fn(() => query) });

    const { getStudioCounts } = await import("@/lib/studio");
    const counts = await getStudioCounts();

    expect(query.eq).toHaveBeenCalledWith("moderation_status", "pending");
    expect(counts.pendingPhotos).toBe(7);
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
    mocks.select.mockReset();
    mocks.selectEq.mockReset();
    mocks.maybeSingle.mockReset();
    mocks.analyzePlaceAccessibility.mockReset();
    mocks.after.mockClear();
    mocks.from.mockReset();
    mocks.requireUser.mockResolvedValue({ id: "moderator-1" });
    mocks.getCurrentProfile.mockResolvedValue({ id: "moderator-1", role: "moderator" });
    mocks.update.mockReturnValue({ eq: mocks.updateEq });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.select.mockReturnValue({ eq: mocks.selectEq });
    mocks.selectEq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.maybeSingle.mockResolvedValue({ data: { slug: "manual-trailhead" } });
    mocks.analyzePlaceAccessibility.mockResolvedValue({ status: "completed" });
    mocks.from.mockReturnValue({ update: mocks.update, select: mocks.select });
  });

  it("approves photos and records audit fields", async () => {
    const formData = new FormData();
    formData.set("photoId", "photo-1");
    mocks.maybeSingle.mockResolvedValueOnce({ data: { place_id: "place-1" } });

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
    expect(mocks.after).toHaveBeenCalled();
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

  it("approves pending places and records audit fields", async () => {
    const formData = new FormData();
    formData.set("placeId", "place-1");

    const { approvePlaceAction } = await import("@/lib/studio-actions");
    await approvePlaceAction(formData);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_status: "published",
        reviewed_by: "moderator-1",
        reviewed_at: expect.any(String),
      }),
    );
    expect(mocks.updateEq).toHaveBeenCalledWith("id", "place-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/studio/places");
  });

  it("rejects pending places so they remain hidden from public discovery", async () => {
    const formData = new FormData();
    formData.set("placeId", "place-1");

    const { rejectPlaceAction } = await import("@/lib/studio-actions");
    await rejectPlaceAction(formData);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publish_status: "hidden",
        reviewed_by: "moderator-1",
      }),
    );
  });

  it("accepts suggested updates and triggers re-analysis", async () => {
    const formData = new FormData();
    formData.set("updateId", "update-1");
    mocks.maybeSingle.mockResolvedValueOnce({ data: { place_id: "place-1" } });

    const { acceptUpdateRequestAction } = await import("@/lib/studio-actions");
    await acceptUpdateRequestAction(formData);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "accepted",
        reviewed_by: "moderator-1",
        reviewed_at: expect.any(String),
      }),
    );
    expect(mocks.analyzePlaceAccessibility).toHaveBeenCalledWith("place-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/studio/updates");
  });

  it("rejects suggested updates without changing public observations", async () => {
    const formData = new FormData();
    formData.set("updateId", "update-1");
    mocks.maybeSingle.mockResolvedValueOnce({ data: { place_id: "place-1" } });

    const { rejectUpdateRequestAction } = await import("@/lib/studio-actions");
    await rejectUpdateRequestAction(formData);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        reviewed_by: "moderator-1",
      }),
    );
    expect(mocks.analyzePlaceAccessibility).not.toHaveBeenCalled();
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
