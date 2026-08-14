import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhotoUploader } from "@/components/contributions/photo-uploader";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("photo uploader category defaults", () => {
  it("preselects a requested photo category", () => {
    render(
      <PhotoUploader
        existingPhotos={[]}
        initialCategory="doorway_closeup"
        placeId="place-1"
        placeSlug="main-street-square"
        userId="user-1"
      />,
    );

    expect(screen.getByLabelText("Photo category")).toHaveValue("doorway_closeup");
  });
});
