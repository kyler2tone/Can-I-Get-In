import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExploreCities } from "@/components/discovery/explore-cities";
import { PopularNearYou } from "@/components/discovery/popular-near-you";
import {
  distanceMiles,
  findDiscoverablePlaces,
  rankDiscoveryPlaces,
  validCoordinates,
  type DiscoveryPlace,
} from "@/lib/discovery";

const mocks = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from,
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mocks.createSignedUrl,
      })),
    },
  })),
}));

const basePlaceRows = [
  {
    id: "place-far",
    name: "Far Cafe",
    slug: "far-cafe",
    address: "100 Far Street",
    latitude: 44.2,
    longitude: -103.4,
    category: "Coffee",
    current_entry_status: "insufficient_information",
    current_summary: "Needs photos.",
    community_confidence: 0.2,
    last_verified_at: null,
    cities: {
      name: "Rapid City",
      state: "SD",
      slug: "rapid-city-sd",
      latitude: 44.080543,
      longitude: -103.231014,
    },
  },
  {
    id: "place-near",
    name: "Near Library",
    slug: "near-library",
    address: "200 Near Street",
    latitude: 44.081,
    longitude: -103.231,
    category: "Library",
    current_entry_status: "likely_independent",
    current_summary: "Entrance documented.",
    community_confidence: 0.8,
    last_verified_at: null,
    cities: {
      name: "Rapid City",
      state: "SD",
      slug: "rapid-city-sd",
      latitude: 44.080543,
      longitude: -103.231014,
    },
  },
] as const;

describe("discovery distance and ranking", () => {
  it("orders by geographic distance when location is supplied", () => {
    const ranked = rankDiscoveryPlaces(
      [
        { name: "Far", distanceMiles: 20, approvedPhotoCount: 10 },
        { name: "Near", distanceMiles: 1, approvedPhotoCount: 0 },
      ],
      true,
    );

    expect(ranked.map((place) => place.name)).toEqual(["Near", "Far"]);
    expect(distanceMiles({ latitude: 44.0805, longitude: -103.231 }, {
      latitude: 44.081,
      longitude: -103.231,
    })).toBeLessThan(0.1);
  });

  it("falls back to approved photo coverage when no location is supplied", () => {
    const ranked = rankDiscoveryPlaces(
      [
        { name: "Few photos", distanceMiles: null, approvedPhotoCount: 1 },
        { name: "More photos", distanceMiles: null, approvedPhotoCount: 4 },
      ],
      false,
    );

    expect(ranked[0].name).toBe("More photos");
  });

  it("rejects missing or invalid coordinates", () => {
    expect(validCoordinates({ latitude: 91, longitude: -103 })).toBe(false);
    expect(validCoordinates({ latitude: 44, longitude: -103 })).toBe(true);
  });
});

describe("real discovery data", () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.createSignedUrl.mockReset();
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://example.com/photo.jpg" } });
  });

  it("finds published places, filters invalid coordinates, and returns human-readable URLs", async () => {
    const placesQuery = queryMock({
      data: [
        ...basePlaceRows,
        {
          ...basePlaceRows[0],
          id: "bad-coordinates",
          slug: "bad-coordinates",
          latitude: null,
        },
      ],
      error: null,
    });
    const photosQuery = queryMock({
      data: [
        {
          id: "photo-1",
          place_id: "place-near",
          storage_path: "place-photos/place-near/user/photo.webp",
          created_at: "2026-08-14T12:00:00.000Z",
        },
      ],
      error: null,
    });

    mocks.from
      .mockReturnValueOnce({ select: vi.fn(() => placesQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => photosQuery) });

    const places = await findDiscoverablePlaces({
      coordinates: { latitude: 44.0805, longitude: -103.231 },
    });

    expect(places.map((place) => place.slug)).toEqual(["near-library", "far-cafe"]);
    expect(places[0].url).toBe("/places/near-library");
    expect(places[0].approvedPhotoCount).toBe(1);
    expect(photosQuery.eq).toHaveBeenCalledWith("moderation_status", "approved");
  });

  it("supports focused place and city search without fabricated data", async () => {
    const placesQuery = queryMock({ data: basePlaceRows, error: null });
    const photosQuery = queryMock({ data: [], error: null });
    mocks.from
      .mockReturnValueOnce({ select: vi.fn(() => placesQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => photosQuery) });

    const places = await findDiscoverablePlaces({ query: "library", city: "rapid" });

    expect(places).toHaveLength(1);
    expect(places[0].name).toBe("Near Library");
  });

  it("applies category filters within a selected city scope", async () => {
    const placesQuery = queryMock({
      data: [
        { ...basePlaceRows[0], category: "Coffee shop" },
        { ...basePlaceRows[1], category: "Library" },
      ],
      error: null,
    });
    const photosQuery = queryMock({ data: [], error: null });
    mocks.from
      .mockReturnValueOnce({ select: vi.fn(() => placesQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => photosQuery) });

    const places = await findDiscoverablePlaces({ city: "Rapid City, SD", category: "coffee" });

    expect(places).toHaveLength(1);
    expect(places[0].name).toBe("Far Cafe");
    expect(placesQuery.ilike).toHaveBeenCalledWith("category", "%Coffee shop%");
  });
});

describe("discovery UI states", () => {
  it("shows an intentional Explore Cities empty state", () => {
    render(<ExploreCities cities={[]} />);

    expect(screen.getByText("Help put your city on the map.")).toBeInTheDocument();
    expect(screen.queryByText(/3,281/)).not.toBeInTheDocument();
  });

  it("links featured cities to a city-scoped map view", () => {
    render(
      <ExploreCities
        cities={[
          {
            name: "Rapid City",
            state: "SD",
            slug: "rapid-city-sd",
            latitude: 44.080543,
            longitude: -103.231014,
            placeCount: 2,
            approvedPhotoCount: 4,
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /Rapid City/i })).toHaveAttribute(
      "href",
      "/map?city=Rapid%20City%2C%20SD",
    );
  });

  it("keeps Popular Near You usable when location is denied", () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((_success, failure) =>
          failure({ code: 1, PERMISSION_DENIED: 1 }),
        ),
      },
    });

    render(<PopularNearYou initialPlaces={[discoveryPlace]} />);
    fireEvent.click(screen.getByRole("button", { name: "Use my location" }));

    expect(screen.getByText("Location access is off. You can still search or browse the map.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Example Place/i })).toHaveAttribute(
      "href",
      "/places/example-place",
    );
  });
});

const discoveryPlace: DiscoveryPlace = {
  id: "place-1",
  name: "Example Place",
  slug: "example-place",
  address: "1 Main Street",
  city: "Rapid City",
  state: "SD",
  category: "Cafe",
  latitude: 44.08,
  longitude: -103.23,
  currentEntryStatus: "insufficient_information",
  currentSummary: "Needs accessibility photos.",
  communityConfidence: 0,
  lastVerifiedAt: null,
  approvedPhotoCount: 0,
  thumbnailUrl: null,
  distanceMiles: null,
  url: "/places/example-place",
};

function queryMock<T>(result: T) {
  const query = {
    eq: vi.fn(),
    ilike: vi.fn(),
    in: vi.fn(),
    limit: vi.fn(),
    order: vi.fn(),
    then(resolve: (value: T) => void) {
      resolve(result);
    },
  };

  query.eq.mockReturnValue(query);
  query.ilike.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.order.mockReturnValue(query);

  return query;
}
