import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { analyzePlaceAccessibility } from "@/lib/openai-accessibility";
import { objectPathFromDatabasePath } from "@/lib/photo-upload";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const { user } = await requireCompletedProfile();
  const payload = (await request.json().catch(() => null)) as { photoId?: unknown } | null;
  const photoId = typeof payload?.photoId === "string" ? payload.photoId : "";

  if (!photoId) {
    return NextResponse.json({ message: "Choose a photo to delete." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: photo, error: readError } = await supabase
    .from("place_photos")
    .select("id, place_id, uploader_id, storage_path, moderation_status")
    .eq("id", photoId)
    .maybeSingle();

  if (readError || !photo) {
    return NextResponse.json({ message: "Photo could not be found." }, { status: 404 });
  }

  if (photo.uploader_id !== user.id) {
    return NextResponse.json({ message: "You can only delete your own photos." }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from("place_photos").delete().eq("id", photoId);
  if (deleteError) {
    return NextResponse.json({ message: "Photo could not be deleted. Try again." }, { status: 400 });
  }

  await supabase.storage.from("place-photos").remove([objectPathFromDatabasePath(photo.storage_path)]);

  if (photo.moderation_status === "approved") {
    void analyzePlaceAccessibility(photo.place_id).catch(() => undefined);
  }

  return NextResponse.json({ message: "Photo deleted." });
}
