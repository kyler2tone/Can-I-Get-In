import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompletedProfile } from "@/lib/auth";
import { isAccessibilityFactor } from "@/lib/accessibility-factors";
import { getSupabaseServerClient } from "@/lib/supabase";

const suggestUpdateSchema = z.object({
  placeId: z.string().uuid(),
  factors: z.array(z.string().refine(isAccessibilityFactor)).max(8).default([]),
  suggestedStatus: z.enum(["yes", "no", "unknown"]).nullable().default(null),
  explanation: z.string().trim().min(3, "Tell us what changed or looks incorrect.").max(1000),
});

export async function POST(request: Request) {
  const { user } = await requireCompletedProfile();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Check the update details and try again." }, { status: 400 });
  }

  const parsed = suggestUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the update details and try again." },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("place_update_requests").insert({
    place_id: parsed.data.placeId,
    contributor_id: user.id,
    factors: parsed.data.factors,
    suggested_status: parsed.data.suggestedStatus,
    explanation: parsed.data.explanation,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ message: "Update could not be submitted right now." }, { status: 400 });
  }

  return NextResponse.json({ message: "Thanks. Your update was submitted for review." });
}
