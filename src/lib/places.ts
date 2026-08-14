import { getSupabaseServerClient } from "@/lib/supabase";
import { objectPathFromDatabasePath } from "@/lib/photo-upload";
import { photoCategories, type PhotoCategory } from "@/lib/photo-categories";
import type { Observation } from "@/lib/types";

export type DatabasePlace = {
  id: string;
  slug: string;
  name: string;
  address: string;
  category: string | null;
  latitude: number;
  longitude: number;
  current_entry_status: string;
  current_summary: string | null;
  community_confidence: number;
  last_verified_at: string | null;
};

export type PlacePhoto = {
  id: string;
  place_id: string;
  uploader_id: string | null;
  storage_path: string;
  category: PhotoCategory;
  moderation_status: "pending" | "approved" | "hidden" | "rejected";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  signedUrl: string | null;
  canManage: boolean;
};

export async function getDatabasePlaceBySlug(slug: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("places")
    .select(
      "id, slug, name, address, category, latitude, longitude, current_entry_status, current_summary, community_confidence, last_verified_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  return data as DatabasePlace | null;
}

export async function getPlacePageData(slug: string) {
  const databasePlace = await getDatabasePlaceBySlug(slug);

  if (!databasePlace) {
    return null;
  }

  return {
    databasePlace,
    samplePlace: null,
    id: databasePlace.id,
    slug,
    name: databasePlace.name,
    address: databasePlace.address,
    category: databasePlace.category ?? "Place",
    latitude: Number(databasePlace.latitude),
    longitude: Number(databasePlace.longitude),
    currentEntryStatus: databasePlace.current_entry_status,
    currentSummary:
      databasePlace.current_summary ??
      "Community details are still being gathered for this place.",
    communityConfidence: `${Math.round(databasePlace.community_confidence * 100)}%`,
    lastVerifiedAt: databasePlace.last_verified_at?.slice(0, 10) ?? "Not yet verified",
    observations: [] as Observation[],
    missingInformation: [] as string[],
  };
}

export async function getApprovedPlacePhotos(placeId: string | null) {
  return getPlacePhotos(placeId, { approvedOnly: true });
}

export async function getManageablePlacePhotos(placeId: string | null) {
  return getPlacePhotos(placeId, { approvedOnly: false });
}

async function getPlacePhotos(placeId: string | null, { approvedOnly }: { approvedOnly: boolean }) {
  if (!placeId) {
    return [];
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("place_photos")
    .select(
      "id, place_id, uploader_id, storage_path, category, moderation_status, reviewed_by, reviewed_at, created_at",
    )
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (approvedOnly) {
    query = query.eq("moderation_status", "approved");
  }

  const { data } = await query;

  const photos = (data ?? []) as Omit<PlacePhoto, "signedUrl" | "canManage">[];

  const withUrls = await Promise.all(
    photos.map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from("place-photos")
        .createSignedUrl(objectPathFromDatabasePath(photo.storage_path), 60 * 30);

      return {
        ...photo,
        signedUrl: signed?.signedUrl ?? null,
        canManage: user?.id === photo.uploader_id,
      };
    }),
  );

  return withUrls;
}

export function groupPhotosByCategory(photos: PlacePhoto[]) {
  return photoCategories.map((category) => ({
    ...category,
    photos: photos.filter((photo) => photo.category === category.value),
  }));
}
