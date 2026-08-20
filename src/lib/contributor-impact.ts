import { getSupabaseServerClient } from "@/lib/supabase";

export type ContributorBadge = {
  slug: string;
  name: string;
  description: string;
  earned: boolean;
  progressLabel: string;
  progress: number;
  target: number;
};

export type RecentContribution = {
  id: string;
  placeName: string;
  placeSlug: string;
  description: string;
  createdAt: string;
};

export type PlaceHelped = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  contributionCount: number;
};

export type ContributorImpact = {
  points: number;
  contributionCount: number;
  approvedPhotoCount: number;
  acceptedUpdateCount: number;
  publishedPlaceCount: number;
  placesHelped: number;
  citiesHelped: number;
  recentContributions: RecentContribution[];
  helpedPlaces: PlaceHelped[];
  badges: ContributorBadge[];
  earnedBadges: ContributorBadge[];
};

type PlaceInfo = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
};

export async function getContributorImpact(userId: string): Promise<ContributorImpact> {
  const supabase = await getSupabaseServerClient();
  const [photosResult, updatesResult, placesResult] = await Promise.all([
    supabase
      .from("place_photos")
      .select("id, place_id, category, created_at")
      .eq("uploader_id", userId)
      .eq("moderation_status", "approved"),
    supabase
      .from("place_update_requests")
      .select("id, place_id, factors, created_at")
      .eq("contributor_id", userId)
      .eq("status", "accepted"),
    supabase
      .from("places")
      .select("id, name, slug, city_id, created_at")
      .eq("submitted_by", userId)
      .eq("publish_status", "published"),
  ]);

  const photos = (photosResult.data ?? []) as Array<{
    id: string;
    place_id: string;
    category: string | null;
    created_at: string;
  }>;
  const updates = (updatesResult.data ?? []) as Array<{
    id: string;
    place_id: string;
    factors: string[] | null;
    created_at: string;
  }>;
  const submittedPlaces = (placesResult.data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    city_id: string | null;
    created_at: string;
  }>;

  const placeIds = [
    ...new Set([
      ...photos.map((photo) => photo.place_id),
      ...updates.map((update) => update.place_id),
      ...submittedPlaces.map((place) => place.id),
    ]),
  ].filter(Boolean);

  const placeInfo = await loadPlaceInfo(placeIds);
  const helpedPlaceIds = new Set(placeIds);
  const helpedCityKeys = new Set(
    [...helpedPlaceIds]
      .map((placeId) => placeInfo.get(placeId))
      .filter((place): place is PlaceInfo => Boolean(place?.city && place?.state))
      .map((place) => `${place.city}|${place.state}`),
  );

  const contributionCount = photos.length + updates.length + submittedPlaces.length;
  const points = photos.length * 5 + updates.length * 8 + submittedPlaces.length * 12;
  const helpedPlaces = [...helpedPlaceIds]
    .map((placeId) => {
      const place = placeInfo.get(placeId);
      if (!place) return null;
      return {
        id: place.id,
        name: place.name,
        slug: place.slug,
        city: place.city,
        state: place.state,
        contributionCount:
          photos.filter((photo) => photo.place_id === place.id).length +
          updates.filter((update) => update.place_id === place.id).length +
          submittedPlaces.filter((submitted) => submitted.id === place.id).length,
      };
    })
    .filter((place): place is PlaceHelped => Boolean(place))
    .sort((a, b) => b.contributionCount - a.contributionCount || a.name.localeCompare(b.name))
    .slice(0, 6);

  const recentContributions = [
    ...photos.map((photo) => recentItem(photo.id, photo.place_id, placeInfo, "Photo approved", photo.created_at)),
    ...updates.map((update) => recentItem(update.id, update.place_id, placeInfo, "Accessibility update accepted", update.created_at)),
    ...submittedPlaces.map((place) =>
      recentItem(place.id, place.id, placeInfo, "Place accepted", place.created_at),
    ),
  ]
    .filter((item): item is RecentContribution => Boolean(item))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const badges = buildBadges({
    contributionCount,
    approvedPhotoCount: photos.length,
    placesHelped: helpedPlaceIds.size,
    cityStarterCount: await cityStarterCount(userId, [...helpedCityKeys]),
  });

  return {
    points,
    contributionCount,
    approvedPhotoCount: photos.length,
    acceptedUpdateCount: updates.length,
    publishedPlaceCount: submittedPlaces.length,
    placesHelped: helpedPlaceIds.size,
    citiesHelped: helpedCityKeys.size,
    recentContributions,
    helpedPlaces,
    badges,
    earnedBadges: badges.filter((badge) => badge.earned),
  };
}

function recentItem(
  id: string,
  placeId: string,
  placeInfo: Map<string, PlaceInfo>,
  description: string,
  createdAt: string,
) {
  const place = placeInfo.get(placeId);
  if (!place) return null;

  return {
    id,
    placeName: place.name,
    placeSlug: place.slug,
    description,
    createdAt,
  };
}

async function loadPlaceInfo(placeIds: string[]) {
  if (!placeIds.length) return new Map<string, PlaceInfo>();
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("places")
    .select("id, name, slug, cities(name, state)")
    .in("id", placeIds);

  return new Map(
    ((data ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      cities: { name: string; state: string } | Array<{ name: string; state: string }> | null;
    }>).map((place) => {
      const city = Array.isArray(place.cities) ? place.cities[0] : place.cities;
      return [
        place.id,
        {
          id: place.id,
          name: place.name,
          slug: place.slug,
          city: city?.name ?? "",
          state: city?.state ?? "",
        },
      ];
    }),
  );
}

async function cityStarterCount(userId: string, cityKeys: string[]) {
  if (!cityKeys.length) return 0;
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("places")
    .select("id, city_id, submitted_by, created_at, cities(name, state)")
    .eq("publish_status", "published")
    .order("created_at", { ascending: true });

  const firstByCity = new Map<string, string | null>();
  for (const place of ((data ?? []) as Array<{
    city_id: string;
    submitted_by: string | null;
    cities: { name: string; state: string } | Array<{ name: string; state: string }> | null;
  }>)) {
    const city = Array.isArray(place.cities) ? place.cities[0] : place.cities;
    const key = city?.name && city?.state ? `${city.name}|${city.state}` : place.city_id;
    if (!firstByCity.has(key)) firstByCity.set(key, place.submitted_by);
  }

  return cityKeys.filter((key) => firstByCity.get(key) === userId).length;
}

function buildBadges({
  contributionCount,
  approvedPhotoCount,
  placesHelped,
  cityStarterCount,
}: {
  contributionCount: number;
  approvedPhotoCount: number;
  placesHelped: number;
  cityStarterCount: number;
}) {
  return [
    badge("first-contribution", "First Contribution", "Made a first approved or accepted contribution.", contributionCount, 1, "meaningful contribution"),
    badge("click-click", "Click Click", "Contributed 5 approved photos.", approvedPhotoCount, 5, "approved photos"),
    badge("touched-grass", "Touched Grass", "Helped 5 unique places.", placesHelped, 5, "places helped"),
    badge("city-starter", "City Starter", "Helped start CIGI coverage in a city.", cityStarterCount, 1, "starter city"),
    badge("local-guide", "Local Guide", "Helped 10 unique places.", placesHelped, 10, "places helped"),
  ];
}

function badge(
  slug: string,
  name: string,
  description: string,
  current: number,
  target: number,
  noun: string,
): ContributorBadge {
  const progress = Math.min(current, target);
  return {
    slug,
    name,
    description,
    earned: current >= target,
    progress,
    target,
    progressLabel: `${progress} / ${target} ${noun}`,
  };
}
