import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { requireCompletedProfile } from "@/lib/auth";
import {
  contributorNotesMaxLength,
  contributorObservationSchema,
} from "@/lib/accessibility-validation";
import { analyzePlaceAccessibility } from "@/lib/openai-accessibility";
import { getSupabaseServerClient } from "@/lib/supabase";

const contributionObservationSchema = z.object({
  placeId: z.string().uuid(),
  photoIds: z.array(z.string().uuid()).max(25).default([]),
  observations: contributorObservationSchema.default({}),
  notes: z
    .string()
    .trim()
    .max(contributorNotesMaxLength, `Notes must be ${contributorNotesMaxLength} characters or fewer.`)
    .optional()
    .default(""),
});

export async function POST(request: Request) {
  const { user } = await requireCompletedProfile();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Check your contribution and try again." }, { status: 400 });
  }

  const parsed = contributionObservationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check your contribution and try again." },
      { status: 400 },
    );
  }

  const observations = Object.fromEntries(
    Object.entries(parsed.data.observations).filter(([, value]) => Boolean(value)),
  );
  const notes = parsed.data.notes.trim();

  if (!Object.keys(observations).length && !notes) {
    return NextResponse.json({ message: "No accessibility observations to save." });
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("contributor_place_observations").insert({
    place_id: parsed.data.placeId,
    contributor_id: user.id,
    photo_ids: parsed.data.photoIds,
    observations,
    notes: notes || null,
  });

  if (error) {
    return NextResponse.json(
      { message: "Accessibility observations could not be saved. Please try again." },
      { status: 400 },
    );
  }

  try {
    after(async () => {
      try {
        await analyzePlaceAccessibility(parsed.data.placeId);
      } catch {
        console.warn("[accessibility-analysis]", {
          placeId: parsed.data.placeId,
          status: "failed",
        });
      }
    });
  } catch {
    void analyzePlaceAccessibility(parsed.data.placeId).catch(() => undefined);
  }

  return NextResponse.json({ message: "Contribution saved." });
}
