import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoUploader } from "@/components/contributions/photo-uploader";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mocks.getSession,
    },
  }),
}));

describe("photo uploader category defaults", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
    });
    vi.unstubAllGlobals();
  });

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

  it("includes Not needed for ramp present", () => {
    render(
      <PhotoUploader
        existingPhotos={[]}
        placeId="11111111-1111-4111-8111-111111111111"
        placeSlug="main-street-square"
        userId="22222222-2222-4222-8222-222222222222"
      />,
    );

    expect(screen.getByLabelText("Ramp present")).toHaveTextContent("Not needed");
  });

  it("redirects to the public place page after a successful contribution", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ message: "Contribution saved." }),
      })),
    );

    render(
      <PhotoUploader
        existingPhotos={[]}
        placeId="11111111-1111-4111-8111-111111111111"
        placeSlug="main-street-square"
        userId="22222222-2222-4222-8222-222222222222"
      />,
    );

    fireEvent.change(screen.getByLabelText(/Accessibility notes/i), {
      target: { value: "Ramp is not needed because the public entrance is level." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit contribution" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/places/main-street-square"));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
