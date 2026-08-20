import { fireEvent, render, screen } from "@testing-library/react";
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

  it("uses one contribution CTA and keeps accessibility notes visible with a 2,000 character counter", () => {
    render(
      <PhotoUploader
        existingPhotos={[]}
        initialCategory="doorway_closeup"
        placeId="11111111-1111-4111-8111-111111111111"
        placeSlug="main-street-square"
        userId="22222222-2222-4222-8222-222222222222"
      />,
    );

    const notes = screen.getByLabelText(/Accessibility notes/i);
    fireEvent.change(notes, { target: { value: "Level route from the parking area." } });

    expect(screen.getByRole("button", { name: "Submit contribution" })).toBeEnabled();
    expect(screen.getByText("34 / 2000")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Upload selected photo/i })).not.toBeInTheDocument();
  });

  it("renders nuanced accessibility options for counter, restroom, automatic door, and elevator", () => {
    render(
      <PhotoUploader
        existingPhotos={[]}
        placeId="11111111-1111-4111-8111-111111111111"
        placeSlug="main-street-square"
        userId="22222222-2222-4222-8222-222222222222"
      />,
    );

    expect(screen.getByLabelText("Counter / Front Desk")).toHaveTextContent("Lower / accessible height");
    expect(screen.getByLabelText("Counter / Front Desk")).toHaveTextContent("Standing height / tall");
    expect(screen.getByLabelText("Counter / Front Desk")).toHaveTextContent("Not applicable / no counter or front desk");
    expect(screen.getByLabelText("Accessible restroom")).toHaveTextContent("No restroom on site");
    expect(screen.getByLabelText("Automatic door")).toHaveTextContent("No door on site / Not applicable");
    expect(screen.getByLabelText("Elevator")).toHaveTextContent("Not needed");
  });
});
