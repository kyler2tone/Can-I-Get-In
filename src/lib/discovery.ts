import { getSupabaseServerClient } from "@/lib/supabase";
import { objectPathFromDatabasePath } from "@/lib/photo-upload";
import type { EntryOutcome } from "@/lib/types";

const defaultDiscoveryLimit = 24;
const maxDiscoveryRows = 250;
const earthRadiusMiles = 3958.7613;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type DiscoveryPlace = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  category: string | null;
  latitude: number;
  longitude: number;
  currentEntryStatus: EntryOutcome;
  currentSummary: string | null;
  communityConfidence: number;
  lastVerifiedAt: string | null;
  approvedPhotoCount: number;
  thumbnailUrl: string | null;
  distanceMiles: number | null;
  url: string;
};

export type DiscoveryCity = {
  name: string;
  state: string;
  slug: string;
  latitude: number;
  longitude: number;
  placeCount: number;
  approvedPhotoCount: number;
};

export type DiscoveryStats = {
  places: number;
  approvedPhotos: number;
  contributors: number;
};

type BaseDiscoveryPlace = Omit<DiscoveryPlace, "approvedPhotoCount" | "thumbnailUrl">;

type PlaceRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  latitude: number | string | null;
  longitude: number | string | null;
  category: string | null;
  current_entry_status: EntryOutcome;
  current_summary: string | null;
  community_confidence: number | string | null;
  last_verified_at: string | null;
  cities: {
    name: string;
    state: string;
    slug: string;
    latitude: number | string | null;
    longitude: number | string | null;
  } | Array<{
    name: string;
    state: string;
    slug: string;
    latitude: number | string | null;
    longitude: number | string | null;
  }> | null;
};

type PhotoRow = {
  id: string;
  place_id: string;
  storage_path: string;
  created_at: string;
};

type CityRow = {
  id: string;
  name: string;
  state: string;
  slug: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

export type DiscoveryQuery = {
  coordinates?: Coordinates | null;
  query?: string;
  city?: string;
  category?: string;
  limit?: number;
};

export async function findDiscoverablePlaces({
  coordinates = null,
  query = "",
  city = "",
  category = "",
  limit = defaultDiscoveryLimit,
}: DiscoveryQuery = {}) {
  const supabase = await getSupabaseServerClient();
  let request = supabase
    .from("places")
    .select(
      "id, name, slug, address, latitude, longitude, category, current_entry_status, current_summary, community_confidence, last_verified_at, cities(name, state, slug, latitude, longitude)",
    )
    .eq("publish_status", "published")
    .limit(maxDiscoveryRows);

  const normalizedCategory = category.trim();
  if (normalizedCategory) {
    request = request.ilike("category", `%${escapeLike(normalizedCategory)}%`);
  }

  const { data, error } = await request;
  if (error) return [];

  const normalizedQuery = normalizeSearch(query);
  const normalizedCity = normalizeSearch(city);
  const rows = ((data ?? []) as unknown as PlaceRow[])
    .map(toBaseDiscoveryPlace)
    .filter(isBaseDiscoveryPlace)
    .filter((place) => {
      if (!normalizedQuery) return true;

      return normalizeSearch(
        `${place.name} ${place.address} ${place.city} ${place.state} ${place.category ?? ""}`,
      ).includes(normalizedQuery);
    })
    .filter((place) => {
      if (!normalizedCity) return true;

      return normalizeSearch(`${place.city} ${place.state}`).includes(normalizedCity);
    })
    .map((place) => ({
      ...place,
      distanceMiles: coordinates ? distanceMiles(coordinates, place) : null,
    }));

  const withPhotos = await attachApprovedPhotoData(rows);
  return rankDiscoveryPlaces(withPhotos, Boolean(coordinates)).slice(0, limit);
}

export async function getDiscoveryCities(limit = 6): Promise<DiscoveryCity[]> {
  const supabase = await getSupabaseServerClient();
  const [{ data: cities }, { data: places }, { data: photos }] = await Promise.all([
    supabase.from("cities").select("id, name, state, slug, latitude, longitude"),
    supabase.from("places").select("id, city_id").eq("publish_status", "published"),
    supabase.from("place_photos").select("id, place_id").eq("moderation_status", "approved"),
  ]);

  const cityRows = (cities ?? []) as CityRow[];
  const placeRows = (places ?? []) as Array<{ id: string; city_id: string }>;
  const photoRows = (photos ?? []) as Array<{ id: string; place_id: string }>;
  const placeToCity = new Map(placeRows.map((place) => [place.id, place.city_id]));
  const counts = new Map<string, { places: number; photos: number }>();

  for (const place of placeRows) {
    const count = counts.get(place.city_id) ?? { places: 0, photos: 0 };
    count.places += 1;
    counts.set(place.city_id, count);
  }

  for (const photo of photoRows) {
    const cityId = placeToCity.get(photo.place_id);
    if (!cityId) continue;
    const count = counts.get(cityId) ?? { places: 0, photos: 0 };
    count.photos += 1;
    counts.set(cityId, count);
  }

  return cityRows
    .map((city) => {
      const count = counts.get(city.id) ?? { places: 0, photos: 0 };

      return {
        name: city.name,
        state: city.state,
        slug: city.slug,
        latitude: Number(city.latitude),
        longitude: Number(city.longitude),
        placeCount: count.places,
        approvedPhotoCount: count.photos,
      };
    })
    .filter((city) => city.placeCount > 0 && validCoordinates(city))
    .sort((a, b) => b.placeCount - a.placeCount || b.approvedPhotoCount - a.approvedPhotoCount)
    .slice(0, limit);
}

export async function getDiscoveryStats(): Promise<DiscoveryStats> {
  const supabase = await getSupabaseServerClient();
  const [places, photos, contributors] = await Promise.all([
    supabase.from("places").select("id", { count: "exact", head: true }).eq("publish_status", "published"),
    supabase
      .from("place_photos")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "approved"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("profile_completed", true),
  ]);

  return {
    places: places.count ?? 0,
    approvedPhotos: photos.count ?? 0,
    contributors: contributors.count ?? 0,
  };
}

export function rankDiscoveryPlaces<T extends Pick<DiscoveryPlace, "distanceMiles" | "approvedPhotoCount" | "name">>(
  places: T[],
  hasLocation: boolean,
) {
  return [...places].sort((a, b) => {
    if (hasLocation) {
      const distanceDelta = (a.distanceMiles ?? Number.POSITIVE_INFINITY) - (b.distanceMiles ?? Number.POSITIVE_INFINITY);
      if (Math.abs(distanceDelta) > 0.05) return distanceDelta;
    }

    return b.approvedPhotoCount - a.approvedPhotoCount || a.name.localeCompare(b.name);
  });
}

export function distanceMiles(from: Coordinates, to: Coordinates) {
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMiles * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function validCoordinates(value: { latitude: number; longitude: number }) {
  return (
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function toBaseDiscoveryPlace(row: PlaceRow): BaseDiscoveryPlace | null {
  if (row.latitude === null || row.longitude === null) return null;
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!validCoordinates({ latitude, longitude })) return null;
  const city = Array.isArray(row.cities) ? row.cities[0] : row.cities;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    city: city?.name ?? "",
    state: city?.state ?? "",
    category: row.category,
    latitude,
    longitude,
    currentEntryStatus: row.current_entry_status,
    currentSummary: row.current_summary,
    communityConfidence: Number(row.community_confidence ?? 0),
    lastVerifiedAt: row.last_verified_at,
    distanceMiles: null,
    url: `/places/${row.slug}`,
  };
}

function isBaseDiscoveryPlace(
  place: ReturnType<typeof toBaseDiscoveryPlace>,
): place is BaseDiscoveryPlace {
  return Boolean(place);
}

async function attachApprovedPhotoData(
  places: BaseDiscoveryPlace[],
): Promise<DiscoveryPlace[]> {
  if (!places.length) return [];

  const supabase = await getSupabaseServerClient();
  const placeIds = places.map((place) => place.id);
  const { data } = await supabase
    .from("place_photos")
    .select("id, place_id, storage_path, created_at")
    .eq("moderation_status", "approved")
    .in("place_id", placeIds)
    .order("created_at", { ascending: false });

  const photosByPlace = new Map<string, PhotoRow[]>();
  for (const photo of ((data ?? []) as PhotoRow[])) {
    photosByPlace.set(photo.place_id, [...(photosByPlace.get(photo.place_id) ?? []), photo]);
  }

  return Promise.all(
    places.map(async (place) => {
      const photos = photosByPlace.get(place.id) ?? [];
      const thumbnail = photos[0];
      let thumbnailUrl: string | null = null;

      if (thumbnail) {
        const { data: signed } = await supabase.storage
          .from("place-photos")
          .createSignedUrl(objectPathFromDatabasePath(thumbnail.storage_path), 60 * 30);
        thumbnailUrl = signed?.signedUrl ?? null;
      }

      return {
        ...place,
        approvedPhotoCount: photos.length,
        thumbnailUrl,
      };
    }),
  );
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, "");
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
