import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { usernameSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = usernameSchema.safeParse(searchParams.get("username") ?? "");

  if (!username.success) {
    return NextResponse.json({
      available: false,
      normalized: "",
      message: username.error.issues[0].message,
    });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("is_username_available", {
    candidate: username.data,
    excluded_user_id: user?.id ?? null,
  });

  if (error) {
    return NextResponse.json({
      available: false,
      normalized: username.data,
      message: "Could not check that username right now.",
    });
  }

  return NextResponse.json({
    available: Boolean(data),
    normalized: username.data,
    message: data ? "Username is available." : "That username is not available.",
  });
}
