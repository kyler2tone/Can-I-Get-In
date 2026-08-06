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
