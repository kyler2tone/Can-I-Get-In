"use server";

import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/roles";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function approvePhotoAction(formData: FormData) {
  await reviewPhoto(formData, "approved");
}

export async function rejectPhotoAction(formData: FormData) {
  await reviewPhoto(formData, "rejected");
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

async function reviewPhoto(formData: FormData, status: "approved" | "rejected") {
  const profile = await requireStudioAccess();
  const photoId = formData.get("photoId");

  if (typeof photoId !== "string" || !photoId) {
    throw new Error("Choose a photo to review.");
  }

  const supabase = await getSupabaseServerClient();
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
