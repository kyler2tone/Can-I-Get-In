import { z } from "zod";
import { distanceMiles, validCoordinates, type Coordinates } from "@/lib/discovery";
import { getSupabaseServerClient } from "@/lib/supabase";

const maxSearchLimit = 8;
const duplicateDistanceMiles = 0.12;

export const googleSessionTokenSchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const googlePlaceIdSchema = z.string().trim().min(3).max(256);

export const manualPlaceSchema = z.object({
  name: z.string().trim().min(2, "Place name is required.").max(120),
  address: z.string().trim().min(4, "Address or location description is required.").max(240),
  city: z.string().trim().min(1, "City is required.").max(80),
  state: z.string().trim().min(1, "State or region is required.").max(40),
  postalCode: z.string().trim().max(20).optional().default(""),
  category: z.string().trim().min(1, "Category is required.").max(80),
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90.").max(90),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180.").max(180),
  website: z.string().trim().url("Enter a valid website URL.").or(z.literal("")).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});

export type ExistingPlaceSearchResult = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  category: string | null;
  publishStatus: string;
  url: string;
  contributeUrl: string;
};

type ExistingPlaceRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  latitude: number | string | null;
  longitude: number | string | null;
  category: string | null;
  publish_status: string;
  cities:
    | {
        name: string;
        state: string;
      }
    | Array<{
        name: string;
        state: string;
      }>
    | null;
};

export async function searchExistingPlaces({
  query,
  city = "",
  limit = maxSearchLimit,
}: {
  query: string;
  city?: string;
  limit?: number;
}) {
  const normalizedQuery = normalizePlaceSearch(query);
  const normalizedCity = normalizePlaceSearch(city);

  if (normalizedQuery.length < 2 && normalizedCity.length < 2) {
    return [];
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("places")
    .select("id, name, slug, address, latitude, longitude, category, publish_status, cities(name, state)")
    .limit(150);

  return ((data ?? []) as unknown as ExistingPlaceRow[])
    .map(toExistingPlaceResult)
    .filter((place): place is ExistingPlaceSearchResult => Boolean(place))
    .filter((place) => {
      const haystack = normalizePlaceSearch(
        `${place.name} ${place.address} ${place.city} ${place.state} ${place.category ?? ""}`,
      );
      const cityHaystack = normalizePlaceSearch(`${place.city} ${place.state}`);
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true;
      const matchesCity = normalizedCity ? cityHaystack.includes(normalizedCity) : true;

      return matchesQuery && matchesCity;
    })
    .slice(0, Math.min(limit, maxSearchLimit));
}

export async function findPlaceByGooglePlaceId(googlePlaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("places")
    .select("id, name, slug, address, publish_status")
    .eq("google_place_id", googlePlaceId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    address: data.address as string,
    publishStatus: data.publish_status as string,
    url: `/places/${data.slug}`,
    contributeUrl: `/places/${data.slug}/contribute`,
  };
}

export async function findPotentialDuplicatePlace({
  name,
  latitude,
  longitude,
}: {
  name: string;
  latitude: number;
  longitude: number;
}) {
  if (!validCoordinates({ latitude, longitude })) return null;

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("places")
    .select("id, name, slug, address, latitude, longitude, publish_status")
    .limit(250);

  const normalizedName = normalizePlaceSearch(name);
  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    address: string;
    latitude: number | string | null;
    longitude: number | string | null;
    publish_status: string;
  }>;

  for (const row of rows) {
    const rowLatitude = Number(row.latitude);
    const rowLongitude = Number(row.longitude);
    if (!validCoordinates({ latitude: rowLatitude, longitude: rowLongitude })) continue;

    const sameName =
      normalizePlaceSearch(row.name) === normalizedName ||
      normalizePlaceSearch(row.name).includes(normalizedName) ||
      normalizedName.includes(normalizePlaceSearch(row.name));

    if (!sameName) continue;

    const distance = distanceMiles(
      { latitude, longitude },
      { latitude: rowLatitude, longitude: rowLongitude },
    );

    if (distance <= duplicateDistanceMiles) {
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        address: row.address,
        publishStatus: row.publish_status,
        url: `/places/${row.slug}`,
        contributeUrl: `/places/${row.slug}/contribute`,
      };
    }
  }

  return null;
}

export async function createGoogleVerifiedPlace(input: {
  googlePlaceId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  category: string;
}) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_google_verified_place", {
    p_google_place_id: input.googlePlaceId,
    p_name: input.name,
    p_address: input.address,
    p_city: input.city,
    p_state: input.state,
    p_postal_code: input.postalCode,
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_category: input.category,
  });

  if (error) throw new Error(error.message);
  return unwrapCreatedPlace(data);
}

export async function createManualPlaceSubmission(input: z.infer<typeof manualPlaceSchema>) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_manual_place_submission", {
    p_name: input.name,
    p_address: input.address,
    p_city: input.city,
    p_state: input.state,
    p_postal_code: input.postalCode,
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_category: input.category,
    p_website: input.website,
    p_notes: input.notes,
  });

  if (error) throw new Error(error.message);
  return unwrapCreatedPlace(data);
}

export function normalizePlaceSearch(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}

export function toContributeUrl(slug: string) {
  return `/places/${slug}/contribute`;
}

function toExistingPlaceResult(row: ExistingPlaceRow): ExistingPlaceSearchResult | null {
  const city = Array.isArray(row.cities) ? row.cities[0] : row.cities;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    city: city?.name ?? "",
    state: city?.state ?? "",
    category: row.category,
    publishStatus: row.publish_status,
    url: `/places/${row.slug}`,
    contributeUrl: `/places/${row.slug}/contribute`,
  };
}

function unwrapCreatedPlace(
  data:
    | null
    | Array<{ place_id: string; place_slug: string; created: boolean; publish_status: string }>
    | { place_id: string; place_slug: string; created: boolean; publish_status: string },
) {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Place could not be created.");

  return {
    id: row.place_id,
    slug: row.place_slug,
    created: row.created,
    publishStatus: row.publish_status,
    url: `/places/${row.place_slug}`,
    contributeUrl: toContributeUrl(row.place_slug),
  };
}

export type PlaceCoordinates = Coordinates;
