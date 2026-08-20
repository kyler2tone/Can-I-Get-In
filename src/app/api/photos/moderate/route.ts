import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { analyzePlaceAccessibility } from "@/lib/openai-accessibility";
import { moderatePlacePhoto, shouldAutoApprovePhotoModeration } from "@/lib/openai-photo-moderation";
import { objectPathFromDatabasePath } from "@/lib/photo-upload";
import { getSupabaseServerClient } from "@/lib/supabase";

const moderatePhotoSchema = z.object({
  photoId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Please sign in before submitting photos." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Choose a photo to moderate." }, { status: 400 });
  }

  const parsed = moderatePhotoSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a valid photo to moderate." }, { status: 400 });
  }

  const { data: photo } = await supabase
    .from("place_photos")
    .select("id, place_id, uploader_id, storage_path, category, moderation_status")
    .eq("id", parsed.data.photoId)
    .maybeSingle();

  if (!photo || photo.uploader_id !== user.id) {
    return NextResponse.json({ message: "Photo could not be found." }, { status: 404 });
  }

  if (photo.moderation_status !== "pending") {
    return NextResponse.json({ message: "Photo has already been reviewed.", status: photo.moderation_status });
  }

  try {
    const { data: signed, error: signedError } = await supabase.storage
      .from("place-photos")
      .createSignedUrl(objectPathFromDatabasePath(photo.storage_path), 60 * 10);
    if (signedError || !signed?.signedUrl) {
      throw new Error("Photo could not be prepared for moderation.");
    }

    const result = await moderatePlacePhoto({
      category: photo.category,
      signedUrl: signed.signedUrl,
    });

    if (!shouldAutoApprovePhotoModeration(result)) {
      return NextResponse.json({ message: "Photo will be reviewed by Studio.", status: "pending" });
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("place_photos")
      .update({
        moderation_status: "approved",
        reviewed_by: user.id,
        reviewed_at: now,
      })
      .eq("id", photo.id)
      .eq("moderation_status", "pending");

    if (error) {
      throw new Error("Photo could not be auto-approved.");
    }

    try {
      after(async () => {
        try {
          await analyzePlaceAccessibility(photo.place_id);
        } catch {
          console.warn("[accessibility-analysis]", {
            placeId: photo.place_id,
            status: "failed",
          });
        }
      });
    } catch {
      void analyzePlaceAccessibility(photo.place_id).catch(() => undefined);
    }

    return NextResponse.json({ message: "Photo approved.", status: "approved" });
  } catch {
    return NextResponse.json({ message: "Photo will be reviewed by Studio.", status: "pending" });
  }
}
