import { NextResponse } from "next/server";
import { searchGooglePlaces } from "@/lib/google-places";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = url.searchParams.get("input") ?? "";
  const sessionToken = url.searchParams.get("sessionToken") ?? "";

  try {
    const results = await searchGooglePlaces({ input, sessionToken });
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Place search is unavailable right now." },
      { status: 400 },
    );
  }
}
