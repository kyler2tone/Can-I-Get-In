import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { getGooglePlaceDetails } from "@/lib/google-places";
import {
  createGoogleVerifiedPlace,
  findPlaceByGooglePlaceId,
  findPotentialDuplicatePlace,
  googlePlaceIdSchema,
  googleSessionTokenSchema,
} from "@/lib/place-identity";
import { isPlaceCategory } from "@/lib/place-categories";

export async function POST(request: Request) {
  await requireCompletedProfile("/places/add");

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Choose a place to add." }, { status: 400 });
  }

  const parsed = parsePayload(payload);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  try {
    const existingByGoogleId = await findPlaceByGooglePlaceId(parsed.placeId);
    if (existingByGoogleId) {
      return NextResponse.json({
        status: "existing",
        place: existingByGoogleId,
        message: "We found this place.",
      });
    }

    const details = await getGooglePlaceDetails({
      placeId: parsed.placeId,
      sessionToken: parsed.sessionToken,
    });

    const legacyDuplicate = await findPotentialDuplicatePlace({
      name: details.name,
      latitude: details.latitude,
      longitude: details.longitude,
    });

    if (legacyDuplicate) {
      return NextResponse.json({
        status: "existing",
        place: legacyDuplicate,
        message: "We found a matching place already in Can I Get In?.",
      });
    }

    const place = await createGoogleVerifiedPlace({
      ...details,
      category: parsed.category,
    });

    return NextResponse.json({
      status: place.created ? "created" : "existing",
      place,
      message: place.created
        ? "Place added. Now document its accessibility."
        : "We found this place.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "This place could not be added." },
      { status: 400 },
    );
  }
}

function parsePayload(payload: unknown):
  | { ok: true; placeId: string; sessionToken: string; category: string }
  | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Choose a place to add." };
  }

  const record = payload as Record<string, unknown>;
  const placeId = googlePlaceIdSchema.safeParse(record.placeId);
  const sessionToken = googleSessionTokenSchema.safeParse(record.sessionToken);
  const category = typeof record.category === "string" ? record.category.trim() : "";

  if (!placeId.success || !sessionToken.success) {
    return { ok: false, message: "Choose a place from the search results." };
  }

  if (!isPlaceCategory(category)) {
    return { ok: false, message: "Choose a category for this place." };
  }

  return { ok: true, placeId: placeId.data, sessionToken: sessionToken.data, category };
}
