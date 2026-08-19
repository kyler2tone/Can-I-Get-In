"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireStudioAccess } from "@/lib/roles";
import { getSupabaseServerClient } from "@/lib/supabase";
import { analyzePlaceAccessibility } from "@/lib/openai-accessibility";

export async function approvePhotoAction(formData: FormData) {
  return reviewPhoto(formData, "approved");
}

export async function rejectPhotoAction(formData: FormData) {
  return reviewPhoto(formData, "rejected");
}

export async function approvePlaceAction(formData: FormData) {
  await reviewPlace(formData, "published");
}

export async function rejectPlaceAction(formData: FormData) {
  await reviewPlace(formData, "hidden");
}

export async function correctAndApprovePlaceAction(formData: FormData) {
  const profile = await requireStudioAccess();
  const placeId = formData.get("placeId");
  const name = formData.get("name");
  const address = formData.get("address");
  const category = formData.get("category");

  if (typeof placeId !== "string" || !placeId) {
    throw new Error("Choose a place to review.");
  }

  if (typeof name !== "string" || name.trim().length < 2) {
    throw new Error("Place name is required.");
  }

  if (typeof address !== "string" || address.trim().length < 4) {
    throw new Error("Address or location is required.");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("places")
    .update({
      name: name.trim(),
      address: address.trim(),
      category: typeof category === "string" ? category.trim() : null,
      publish_status: "published",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", placeId);

  if (error) {
    throw new Error("Place review could not be saved.");
  }

  revalidatePath("/studio/places");
  revalidatePath("/map");
  revalidatePath("/");
}

export async function acceptUpdateRequestAction(formData: FormData) {
  await reviewUpdateRequest(formData, "accepted");
}

export async function rejectUpdateRequestAction(formData: FormData) {
  await reviewUpdateRequest(formData, "rejected");
}

async function reviewPhoto(formData: FormData, status: "approved" | "rejected") {
  const profile = await requireStudioAccess();
  const photoId = formData.get("photoId");

  if (typeof photoId !== "string" || !photoId) {
    throw new Error("Choose a photo to review.");
  }

  const supabase = await getSupabaseServerClient();
  const { data: photo } = await supabase
    .from("place_photos")
    .select("place_id")
    .eq("id", photoId)
    .maybeSingle();
  const { error } = await supabase
    .from("place_photos")
    .update({
      moderation_status: status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", photoId);

  if (error) {
    throw new Error("Photo review could not be saved.");
  }

  revalidatePath("/studio/photos");

  if (status === "approved" && photo?.place_id) {
    after(async () => {
      try {
        const result = await analyzePlaceAccessibility(photo.place_id);
        if (result.status === "failed") {
          console.warn("[accessibility-analysis]", {
            placeId: photo.place_id,
            status: result.status,
          });
        }
      } catch {
        console.warn("[accessibility-analysis]", {
          placeId: photo.place_id,
          status: "failed",
        });
      }
    });
  }

  return {
    ok: true,
    photoId,
    status,
    message: status === "approved" ? "Photo approved" : "Photo rejected",
  };
}

async function reviewPlace(formData: FormData, status: "published" | "hidden") {
  const profile = await requireStudioAccess();
  const placeId = formData.get("placeId");

  if (typeof placeId !== "string" || !placeId) {
    throw new Error("Choose a place to review.");
  }

  const supabase = await getSupabaseServerClient();
  const { data: place } = await supabase
    .from("places")
    .select("slug")
    .eq("id", placeId)
    .maybeSingle();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("places")
    .update({
      publish_status: status,
      reviewed_by: profile.id,
      reviewed_at: now,
      last_verified_at: status === "published" ? now : null,
      updated_at: now,
    })
    .eq("id", placeId);

  if (error) {
    throw new Error("Place review could not be saved.");
  }

  revalidatePath("/studio/places");
  revalidatePath("/map");
  revalidatePath("/");

  if (place?.slug) {
    revalidatePath(`/places/${place.slug}`);
  }
}

async function reviewUpdateRequest(formData: FormData, status: "accepted" | "rejected") {
  const profile = await requireStudioAccess();
  const updateId = formData.get("updateId");

  if (typeof updateId !== "string" || !updateId) {
    throw new Error("Choose an update request to review.");
  }

  const supabase = await getSupabaseServerClient();
  const { data: update } = await supabase
    .from("place_update_requests")
    .select("place_id")
    .eq("id", updateId)
    .maybeSingle();
  const { error } = await supabase
    .from("place_update_requests")
    .update({
      status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", updateId);

  if (error) {
    throw new Error("Suggested update review could not be saved.");
  }

  if (status === "accepted" && update?.place_id) {
    try {
      await analyzePlaceAccessibility(update.place_id);
    } catch {
      console.warn("[accessibility-analysis]", {
        placeId: update.place_id,
        status: "failed",
      });
    }
  }

  revalidatePath("/studio/updates");
}
