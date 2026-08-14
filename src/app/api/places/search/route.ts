import { NextResponse } from "next/server";
import { searchExistingPlaces } from "@/lib/place-identity";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const city = url.searchParams.get("city") ?? "";

  const places = await searchExistingPlaces({ query, city });

  return NextResponse.json({ places });
}
