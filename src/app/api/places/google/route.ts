import { NextResponse } from "next/server";
import { searchGooglePlaces } from "@/lib/google-places";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = url.searchParams.get("input") ?? "";
  const sessionToken = url.searchParams.get("sessionToken") ?? "";
  const city = url.searchParams.get("city") ?? "";
  const latitude = parseOptionalCoordinate(url.searchParams.get("lat"));
  const longitude = parseOptionalCoordinate(url.searchParams.get("lng"));

  try {
    const results = await searchGooglePlaces({
      input,
      sessionToken,
      context: {
        city,
        latitude,
        longitude,
      },
    });
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Place search is unavailable right now." },
      { status: 400 },
    );
  }
}

function parseOptionalCoordinate(value: string | null) {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
