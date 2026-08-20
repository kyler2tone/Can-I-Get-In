import { NextResponse } from "next/server";
import { findDiscoverablePlaces, validCoordinates } from "@/lib/discovery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));
  const hasCoordinates = searchParams.has("lat") && searchParams.has("lng");
  const coordinates =
    hasCoordinates && validCoordinates({ latitude, longitude }) ? { latitude, longitude } : null;

  const places = await findDiscoverablePlaces({
    coordinates,
    query: searchParams.get("q") ?? "",
    city: searchParams.get("city") ?? "",
    state: searchParams.get("state") ?? "",
    category: searchParams.get("category") ?? "",
    limit: 60,
  });

  return NextResponse.json({ places });
}
