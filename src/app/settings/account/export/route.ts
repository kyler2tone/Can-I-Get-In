import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { formatContributorExportText, type ContributorExportPayload } from "@/lib/data-export";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();
  const format = new URL(request.url).searchParams.get("format");

  const [
    profile,
    photos,
    reports,
    verifications,
    contributions,
    badges,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, username, avatar_url, bio, city, state, role, points, contribution_count, profile_completed, created_at, updated_at",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("place_photos")
      .select("id, place_id, category, created_at")
      .eq("uploader_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("accessibility_reports")
      .select("id, place_id, status, summary, entry_outcome, contributor_notes, submitted_at, created_at")
      .eq("contributor_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("report_verifications")
      .select("id, report_id, vote, notes, created_at")
      .eq("contributor_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("contributions")
      .select("id, contribution_type, place_id, report_id, points_awarded, created_at")
      .eq("contributor_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_badges")
      .select("id, badge_id, awarded_at")
      .eq("user_id", user.id)
      .order("awarded_at", { ascending: false }),
  ]);

  const placeIds = Array.from(
    new Set(
      [
        ...(photos.data ?? []).map((item) => item.place_id),
        ...(reports.data ?? []).map((item) => item.place_id),
        ...(contributions.data ?? []).map((item) => item.place_id),
      ].filter(Boolean),
    ),
  );

  const places = placeIds.length
    ? await supabase
        .from("places")
        .select("id, name, slug, address, category")
        .in("id", placeIds)
    : { data: [] };

  const payload: ContributorExportPayload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
    },
    profile: profile.data,
    placesHelped: places.data ?? [],
    uploadedPhotoMetadata: photos.data ?? [],
    reports: reports.data ?? [],
    verifications: verifications.data ?? [],
    contributions: contributions.data ?? [],
    badges: badges.data ?? [],
    excluded: [
      "private sign-in system records",
      "private security credentials",
      "private review fields",
      "private data belonging to other contributors",
      "raw uploaded image files",
    ],
  };

  if (format === "txt") {
    return new NextResponse(formatContributorExportText(payload), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": 'attachment; filename="can-i-get-in-data-export.txt"',
      },
    });
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="can-i-get-in-data-export.json"',
    },
  });
}
