import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { buildAvatarStoragePath, avatarBucket, isOwnAvatarPublicUrl } from "@/lib/avatar-upload";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { avatarUrl?: unknown } | null;
  const avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl.trim() : "";

  if (!avatarUrl) {
    return NextResponse.json({ message: "Avatar URL is required." }, { status: 400 });
  }

  if (!isOwnAvatarPublicUrl(avatarUrl, user.id, process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
    return NextResponse.json({ message: "Avatar URL must point to your uploaded avatar." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/account");
  revalidatePath("/settings/profile");

  return NextResponse.json({ avatarUrl });
}

export async function DELETE() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
  }

  const storagePath = buildAvatarStoragePath(user.id);
  const { error: removeError } = await supabase.storage.from(avatarBucket).remove([storagePath]);

  if (removeError) {
    return NextResponse.json({ message: removeError.message }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/account");
  revalidatePath("/settings/profile");

  return NextResponse.json({ avatarUrl: null });
}
