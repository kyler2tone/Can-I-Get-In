import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnifiedPlaceSearch } from "@/components/places/unified-place-search";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

describe("unified place search", () => {
  beforeEach(() => {
    vi.useRealTimers();
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    vi.stubGlobal("fetch", vi.fn(fetchMock));
  });

  it("shows existing places and Google candidates directly below the input", async () => {
    render(<UnifiedPlaceSearch />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search for a place" }), {
      target: { value: "star" },
    });

    await waitFor(() => expect(screen.getByText("Fuji Japanese Steakhouse & Sushi Bar")).toBeInTheDocument());
    expect(screen.getByText("On Can I Get In?")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Not on CIGI yet")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Add this place/i })).toBeInTheDocument();
  });

  it("uses browser location as optional search bias when requested", async () => {
    const onQueryChange = vi.fn();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({ coords: { latitude: 44.0805, longitude: -103.231 } }),
        ),
      },
    });

    render(<UnifiedPlaceSearch onQueryChange={onQueryChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search for a place" }), {
      target: { value: "Starbucks" },
    });

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
      expect(calls.some((url) => url.includes("/api/places/google") && url.includes("lat=44.0805"))).toBe(true);
    });
    expect(screen.getByRole("button", { name: "Location on" })).toBeInTheDocument();
  });

  it("creates Google candidates through the existing verified-place endpoint", async () => {
    render(<UnifiedPlaceSearch />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search for a place" }), {
      target: { value: "Essence of Coffee Rapid City" },
    });
    await waitFor(() => expect(screen.getByRole("button", { name: /Add this place/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Add this place/i }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/places/essence-of-coffee/contribute"));
  });
});

async function fetchMock(input: RequestInfo | URL) {
  const url = String(input);
  if (url.startsWith("/api/places/search")) {
    return Response.json({
      places: [
        {
          id: "place-1",
          name: "Fuji Japanese Steakhouse & Sushi Bar",
          address: "1731 Eglin Street",
          city: "Rapid City",
          state: "SD",
          category: "Restaurant",
          url: "/places/fuji-japanese-steakhouse-sushi-bar",
          contributeUrl: "/places/fuji-japanese-steakhouse-sushi-bar/contribute",
        },
      ],
    });
  }

  if (url.startsWith("/api/places/google/create")) {
    return Response.json({
      status: "created",
      message: "Place added.",
      place: { contributeUrl: "/places/essence-of-coffee/contribute" },
    });
  }

  if (url.startsWith("/api/places/google")) {
    return Response.json({
      results: [
        {
          placeId: "places/coffee",
          primaryText: "Essence of Coffee",
          secondaryText: "Rapid City, SD",
          fullText: "Essence of Coffee, Rapid City, SD",
          suggestedCategory: "Coffee shop",
        },
      ],
    });
  }

  return Response.json({}, { status: 404 });
}
