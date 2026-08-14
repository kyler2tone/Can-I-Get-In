import { readFileSync } from "node:fs";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  googlePlacesAttributionText,
  searchGooglePlaces,
  transformGooglePlaceDetails,
} from "@/lib/google-places";
import {
  createGoogleVerifiedPlace,
  createManualPlaceSubmission,
  findPotentialDuplicatePlace,
  manualPlaceSchema,
  searchExistingPlaces,
} from "@/lib/place-identity";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from,
    rpc: mocks.rpc,
  })),
}));

describe("Google Places transformation", () => {
  beforeEach(() => {
    process.env.GOOGLE_PLACES_API_KEY = "test-google-key";
  });

  afterEach(() => {
    delete process.env.GOOGLE_PLACES_API_KEY;
  });

  it("requests only autocomplete fields needed for place selection", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            placePrediction: {
              placeId: "places/example",
              structuredFormat: {
                mainText: { text: "Example Cafe" },
                secondaryText: { text: "Rapid City, SD" },
              },
              types: ["cafe"],
            },
          },
        ],
      }),
    })) as unknown as typeof fetch;

    const results = await searchGooglePlaces({
      input: "Example",
      sessionToken: "session_token_123",
      fetcher,
    });

    expect(results[0]).toMatchObject({
      placeId: "places/example",
      primaryText: "Example Cafe",
      secondaryText: "Rapid City, SD",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://places.googleapis.com/v1/places:autocomplete",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Goog-Api-Key": "test-google-key",
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types",
        }),
      }),
    );
  });

  it("transforms place details into minimal CIGI place data", () => {
    const details = transformGooglePlaceDetails({
      id: "places/example",
      displayName: { text: "Example Cafe" },
      formattedAddress: "123 Main St, Rapid City, SD 57701",
      location: { latitude: 44.0805, longitude: -103.231 },
      types: ["coffee_shop"],
      addressComponents: [
        { longText: "Rapid City", types: ["locality"] },
        { shortText: "SD", longText: "South Dakota", types: ["administrative_area_level_1"] },
        { longText: "57701", types: ["postal_code"] },
      ],
    });

    expect(details).toEqual({
      googlePlaceId: "places/example",
      name: "Example Cafe",
      address: "123 Main St, Rapid City, SD 57701",
      city: "Rapid City",
      state: "SD",
      postalCode: "57701",
      latitude: 44.0805,
      longitude: -103.231,
      category: "Coffee Shop",
    });
    expect(googlePlacesAttributionText()).toContain("Google");
  });
});

describe("place identity and duplicates", () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.rpc.mockReset();
  });

  it("searches existing CIGI places before external lookup", async () => {
    const query = queryMock({
      data: [
        {
          id: "place-1",
          name: "Example Cafe",
          slug: "example-cafe",
          address: "123 Main St",
          latitude: 44.0805,
          longitude: -103.231,
          category: "Cafe",
          publish_status: "published",
          cities: { name: "Rapid City", state: "SD" },
        },
      ],
    });
    mocks.from.mockReturnValueOnce({ select: vi.fn(() => query) });

    const places = await searchExistingPlaces({ query: "example", city: "rapid" });

    expect(places[0].contributeUrl).toBe("/places/example-cafe/contribute");
  });

  it("finds legacy duplicate places by nearby matching name", async () => {
    const query = queryMock({
      data: [
        {
          id: "place-1",
          name: "Example Cafe",
          slug: "example-cafe",
          address: "123 Main St",
          latitude: 44.0805,
          longitude: -103.231,
          publish_status: "published",
        },
      ],
    });
    mocks.from.mockReturnValueOnce({ select: vi.fn(() => query) });

    const duplicate = await findPotentialDuplicatePlace({
      name: "Example Cafe",
      latitude: 44.08055,
      longitude: -103.23105,
    });

    expect(duplicate?.contributeUrl).toBe("/places/example-cafe/contribute");
  });

  it("creates Google verified places through the shared RPC", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          place_id: "place-1",
          place_slug: "example-cafe",
          created: true,
          publish_status: "published",
        },
      ],
      error: null,
    });

    const place = await createGoogleVerifiedPlace({
      googlePlaceId: "places/example",
      name: "Example Cafe",
      address: "123 Main St",
      city: "Rapid City",
      state: "SD",
      postalCode: "57701",
      latitude: 44.0805,
      longitude: -103.231,
      category: "Cafe",
    });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_google_verified_place",
      expect.objectContaining({ p_google_place_id: "places/example" }),
    );
    expect(place.contributeUrl).toBe("/places/example-cafe/contribute");
  });

  it("creates manual submissions as pending review places", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          place_id: "place-2",
          place_slug: "manual-place",
          created: true,
          publish_status: "pending_review",
        },
      ],
      error: null,
    });

    const parsed = manualPlaceSchema.parse({
      name: "Manual Place",
      address: "Trailhead near 1st Street",
      city: "Rapid City",
      state: "SD",
      postalCode: "",
      category: "Park",
      latitude: 44.08,
      longitude: -103.23,
      website: "",
      notes: "No listing found.",
    });
    const place = await createManualPlaceSubmission(parsed);

    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_manual_place_submission",
      expect.objectContaining({ p_name: "Manual Place" }),
    );
    expect(place.publishStatus).toBe("pending_review");
    expect(place.contributeUrl).toBe("/places/manual-place/contribute");
  });

  it("keeps the Google Places API key out of the add-place client component", () => {
    const source = readFileSync("src/components/places/add-place-workflow.tsx", "utf8");

    expect(source).not.toContain("GOOGLE_PLACES_API_KEY");
  });
});

function queryMock<T>(result: T) {
  const query = {
    eq: vi.fn(),
    in: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    then(resolve: (value: T) => void) {
      resolve(result);
    },
  };

  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue(result);

  return query;
}
