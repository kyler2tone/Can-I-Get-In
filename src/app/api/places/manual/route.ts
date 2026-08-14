import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import {
  createManualPlaceSubmission,
  findPotentialDuplicatePlace,
  manualPlaceSchema,
} from "@/lib/place-identity";

export async function POST(request: Request) {
  await requireCompletedProfile("/places/add");

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Enter the place details." }, { status: 400 });
  }

  const parsed = manualPlaceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the place details and try again." },
      { status: 400 },
    );
  }

  try {
    const duplicate = await findPotentialDuplicatePlace({
      name: parsed.data.name,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    });

    if (duplicate) {
      return NextResponse.json({
        status: "existing",
        place: duplicate,
        message: "We found a matching place already in Can I Get In?.",
      });
    }

    const place = await createManualPlaceSubmission(parsed.data);

    return NextResponse.json({
      status: "pending",
      place,
      message: "Place submitted for review. You can add photos now.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "This place could not be submitted." },
      { status: 400 },
    );
  }
}
