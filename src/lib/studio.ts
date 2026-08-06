import { getSupabaseServerClient } from "@/lib/supabase";
import { objectPathFromDatabasePath } from "@/lib/photo-upload";
import { getPhotoCategoryLabel, type PhotoCategory } from "@/lib/photo-categories";

type PhotoRow = {
  id: string;
  place_id: string;
  uploader_id: string | null;
  storage_path: string;
  category: PhotoCategory;
  moderation_status: "pending" | "approved" | "hidden" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type PlaceRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
};

export type StudioPhoto = {
  id: string;
  placeId: string;
  placeName: string;
  placeSlug: string;
  placeAddress: string;
  contributorName: string;
  contributorUsername: string | null;
  category: PhotoCategory;
  categoryLabel: string;
  status: PhotoRow["moderation_status"];
  uploadedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  signedUrl: string | null;
};

export async function getPendingStudioPhotos() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("place_photos")
    .select(
      "id, place_id, uploader_id, storage_path, category, moderation_status, reviewed_by, reviewed_at, created_at",
    )
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true });

  return hydrateStudioPhotos((data ?? []) as PhotoRow[]);
}

async function hydrateStudioPhotos(photos: PhotoRow[]): Promise<StudioPhoto[]> {
  if (!photos.length) return [];

  const supabase = await getSupabaseServerClient();
  const placeIds = [...new Set(photos.map((photo) => photo.place_id))];
  const uploaderIds = [
    ...new Set(photos.map((photo) => photo.uploader_id).filter((id): id is string => Boolean(id))),
  ];

  const [{ data: places }, { data: profiles }] = await Promise.all([
    supabase.from("places").select("id, name, slug, address").in("id", placeIds),
    uploaderIds.length
      ? supabase.from("profiles").select("id, display_name, username").in("id", uploaderIds)
      : Promise.resolve({ data: [] }),
  ]);

  const placeById = new Map((places ?? []).map((place) => [place.id, place as PlaceRow]));
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]),
  );

  return Promise.all(
    photos.map(async (photo) => {
      const place = placeById.get(photo.place_id);
      const profile = photo.uploader_id ? profileById.get(photo.uploader_id) : null;
      const { data: signed } = await supabase.storage
        .from("place-photos")
        .createSignedUrl(objectPathFromDatabasePath(photo.storage_path), 60 * 30);

      return {
        id: photo.id,
        placeId: photo.place_id,
        placeName: place?.name ?? "Unknown place",
        placeSlug: place?.slug ?? "",
        placeAddress: place?.address ?? "",
        contributorName: profile?.display_name ?? profile?.username ?? "Former Contributor",
        contributorUsername: profile?.username ?? null,
        category: photo.category,
        categoryLabel: getPhotoCategoryLabel(photo.category),
        status: photo.moderation_status,
        uploadedAt: photo.created_at,
        reviewedBy: photo.reviewed_by,
        reviewedAt: photo.reviewed_at,
        signedUrl: signed?.signedUrl ?? null,
      };
    }),
  );
}
