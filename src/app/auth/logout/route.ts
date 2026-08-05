import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/auth-urls";

export async function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: {
      Allow: "POST",
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();

  const requestUrl = new URL(request.url);
  return NextResponse.redirect(new URL("/", requestUrl.origin || getSiteUrl()));
}
