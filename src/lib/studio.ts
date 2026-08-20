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

type PendingPlaceRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  category: string | null;
  source: string;
  publish_status: string;
  verification_notes: string | null;
  submitted_by: string | null;
  created_at: string;
};

type PlacePhotoPreviewRow = {
  id: string;
  place_id: string;
  storage_path: string;
  category: PhotoCategory;
  moderation_status: string;
};

export type StudioPlace = {
  id: string;
  name: string;
  slug: string;
  address: string;
  category: string;
  source: string;
  status: string;
  verificationNotes: string | null;
  submittedAt: string;
  contributorName: string;
  contributorUsername: string | null;
  photos: Array<{
    id: string;
    categoryLabel: string;
    status: string;
    signedUrl: string | null;
  }>;
};

type UpdateRequestRow = {
  id: string;
  place_id: string;
  contributor_id: string | null;
  factors: string[];
  suggested_status: "yes" | "no" | "unknown" | null;
  explanation: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type StudioUpdateRequest = {
  id: string;
  placeId: string;
  placeName: string;
  placeSlug: string;
  factors: string[];
  suggestedStatus: string;
  explanation: string;
  submittedAt: string;
  contributorName: string;
  contributorUsername: string | null;
};

export type StudioCounts = {
  pendingPhotos: number;
  pendingPlaces: number;
  pendingUpdates: number;
};

export async function getStudioCounts(): Promise<StudioCounts> {
  const supabase = await getSupabaseServerClient();
  const [photos, places, updates] = await Promise.all([
    supabase
      .from("place_photos")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "pending"),
    supabase
      .from("places")
      .select("id", { count: "exact", head: true })
      .eq("publish_status", "pending_review"),
    supabase
      .from("place_update_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    pendingPhotos: photos.count ?? 0,
    pendingPlaces: places.count ?? 0,
    pendingUpdates: updates.count ?? 0,
  };
}

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

export async function getPendingStudioPlaces() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("places")
    .select("id, name, slug, address, category, source, publish_status, verification_notes, submitted_by, created_at")
    .eq("publish_status", "pending_review")
    .order("created_at", { ascending: true });

  return hydrateStudioPlaces((data ?? []) as PendingPlaceRow[]);
}

export async function getPendingStudioUpdateRequests() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("place_update_requests")
    .select("id, place_id, contributor_id, factors, suggested_status, explanation, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return hydrateStudioUpdateRequests((data ?? []) as UpdateRequestRow[]);
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

async function hydrateStudioUpdateRequests(
  updates: UpdateRequestRow[],
): Promise<StudioUpdateRequest[]> {
  if (!updates.length) return [];

  const supabase = await getSupabaseServerClient();
  const placeIds = [...new Set(updates.map((update) => update.place_id))];
  const contributorIds = [
    ...new Set(updates.map((update) => update.contributor_id).filter((id): id is string => Boolean(id))),
  ];

  const [{ data: places }, { data: profiles }] = await Promise.all([
    supabase.from("places").select("id, name, slug").in("id", placeIds),
    contributorIds.length
      ? supabase.from("profiles").select("id, display_name, username").in("id", contributorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const placeById = new Map(
    ((places ?? []) as Array<{ id: string; name: string; slug: string }>).map((place) => [place.id, place]),
  );
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]),
  );

  return updates.map((update) => {
    const place = placeById.get(update.place_id);
    const profile = update.contributor_id ? profileById.get(update.contributor_id) : null;

    return {
      id: update.id,
      placeId: update.place_id,
      placeName: place?.name ?? "Unknown place",
      placeSlug: place?.slug ?? "",
      factors: update.factors,
      suggestedStatus: update.suggested_status ?? "No specific status",
      explanation: update.explanation,
      submittedAt: update.created_at,
      contributorName: profile?.display_name ?? profile?.username ?? "Contributor",
      contributorUsername: profile?.username ?? null,
    };
  });
}

async function hydrateStudioPlaces(places: PendingPlaceRow[]): Promise<StudioPlace[]> {
  if (!places.length) return [];

  const supabase = await getSupabaseServerClient();
  const placeIds = places.map((place) => place.id);
  const submitterIds = [
    ...new Set(places.map((place) => place.submitted_by).filter((id): id is string => Boolean(id))),
  ];

  const [{ data: profiles }, { data: photos }] = await Promise.all([
    submitterIds.length
      ? supabase.from("profiles").select("id, display_name, username").in("id", submitterIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("place_photos")
      .select("id, place_id, storage_path, category, moderation_status")
      .in("place_id", placeIds),
  ]);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]),
  );
  const photosByPlace = new Map<string, PlacePhotoPreviewRow[]>();

  for (const photo of ((photos ?? []) as PlacePhotoPreviewRow[])) {
    photosByPlace.set(photo.place_id, [...(photosByPlace.get(photo.place_id) ?? []), photo]);
  }

  return Promise.all(
    places.map(async (place) => {
      const profile = place.submitted_by ? profileById.get(place.submitted_by) : null;
      const placePhotos = await Promise.all(
        (photosByPlace.get(place.id) ?? []).slice(0, 4).map(async (photo) => {
          const { data: signed } = await supabase.storage
            .from("place-photos")
            .createSignedUrl(objectPathFromDatabasePath(photo.storage_path), 60 * 30);

          return {
            id: photo.id,
            categoryLabel: getPhotoCategoryLabel(photo.category),
            status: photo.moderation_status,
            signedUrl: signed?.signedUrl ?? null,
          };
        }),
      );

      return {
        id: place.id,
        name: place.name,
        slug: place.slug,
        address: place.address,
        category: place.category ?? "Place",
        source: place.source,
        status: place.publish_status,
        verificationNotes: place.verification_notes,
        submittedAt: place.created_at,
        contributorName: profile?.display_name ?? profile?.username ?? "Contributor",
        contributorUsername: profile?.username ?? null,
        photos: placePhotos,
      };
    }),
  );
}
