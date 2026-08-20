import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoGallery } from "@/components/places/photo-gallery";
import type { PlacePhoto } from "@/lib/places";

describe("public photo lightbox", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("opens, navigates within the selected category, and closes from a thumbnail", () => {
    render(<PhotoGallery photos={photos} placeSlug="example-place" />);

    fireEvent.click(screen.getAllByRole("button", { name: "Entrance Overview accessibility photo" })[0]);

    expect(screen.getByRole("dialog", { name: "Photo viewer" })).toBeInTheDocument();
    expect(screen.getByAltText("Entrance Overview accessibility photo enlarged")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByAltText("Entrance Overview accessibility photo enlarged")).toBeInTheDocument();
    expect(screen.getByText(/2 of 2/)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Photo viewer" })).not.toBeInTheDocument();
  });

  it("closes from the backdrop without closing when the image is clicked", () => {
    render(<PhotoGallery photos={photos} placeSlug="example-place" />);

    fireEvent.click(screen.getAllByRole("button", { name: "Entrance Overview accessibility photo" })[0]);
    fireEvent.mouseDown(screen.getByAltText("Entrance Overview accessibility photo enlarged"));
    expect(screen.getByRole("dialog", { name: "Photo viewer" })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("dialog", { name: "Photo viewer" }));
    expect(screen.queryByRole("dialog", { name: "Photo viewer" })).not.toBeInTheDocument();
  });

  it("closes from mobile pointer backdrop without closing when the image is tapped", () => {
    render(<PhotoGallery photos={photos} placeSlug="example-place" />);

    fireEvent.click(screen.getAllByRole("button", { name: "Entrance Overview accessibility photo" })[0]);
    fireEvent.pointerDown(screen.getByAltText("Entrance Overview accessibility photo enlarged"));
    expect(screen.getByRole("dialog", { name: "Photo viewer" })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("dialog", { name: "Photo viewer" }));
    expect(screen.queryByRole("dialog", { name: "Photo viewer" })).not.toBeInTheDocument();
  });

  it("does not show delete controls in the public lightbox", async () => {
    render(<PhotoGallery photos={photos} placeSlug="example-place" />);
    fireEvent.click(screen.getAllByRole("button", { name: "Entrance Overview accessibility photo" })[0]);
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Photo viewer" })).toBeInTheDocument());

    expect(screen.queryByRole("button", { name: "Photo options" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete photo" })).not.toBeInTheDocument();
  });
});

const photos: PlacePhoto[] = [
  {
    id: "photo-1",
    place_id: "place-1",
    uploader_id: "user-1",
    storage_path: "place-photos/place-1/user-1/photo.webp",
    category: "entrance_overview",
    moderation_status: "approved",
    created_at: "2026-08-18T12:00:00.000Z",
    signedUrl: "https://example.com/entrance.webp",
    canManage: true,
  },
  {
    id: "photo-3",
    place_id: "place-1",
    uploader_id: "user-3",
    storage_path: "place-photos/place-1/user-3/photo.webp",
    category: "entrance_overview",
    moderation_status: "approved",
    created_at: "2026-08-18T14:00:00.000Z",
    signedUrl: "https://example.com/entrance-2.webp",
    canManage: false,
  },
  {
    id: "photo-2",
    place_id: "place-1",
    uploader_id: "user-2",
    storage_path: "place-photos/place-1/user-2/photo.webp",
    category: "parking",
    moderation_status: "approved",
    created_at: "2026-08-18T13:00:00.000Z",
    signedUrl: "https://example.com/parking.webp",
    canManage: false,
  },
];
