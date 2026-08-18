import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzePlaceAccessibility } from "@/lib/openai-accessibility";
import { requireStudioAccess } from "@/lib/roles";

const analyzePlaceSchema = z.object({
  placeId: z.string().uuid(),
});

export async function POST(request: Request) {
  await requireStudioAccess();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Choose a place to analyze." }, { status: 400 });
  }

  const parsed = analyzePlaceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a valid place to analyze." }, { status: 400 });
  }

  const result = await analyzePlaceAccessibility(parsed.data.placeId);
  if (result.status === "failed") {
    return NextResponse.json(
      { message: "Accessibility analysis could not be completed.", result },
      { status: 502 },
    );
  }

  return NextResponse.json({ message: "Accessibility analysis finished.", result });
}
