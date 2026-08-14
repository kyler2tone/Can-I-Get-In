"use client";

import { useState } from "react";
import { ArrowRight, LocateFixed } from "lucide-react";
import Link from "next/link";
import { PlaceCard } from "@/components/discovery/place-card";
import { Button } from "@/components/ui/button";
import type { DiscoveryPlace } from "@/lib/discovery";

type LocationState = "idle" | "loading" | "available" | "denied" | "unavailable" | "error";

export function PopularNearYou({ initialPlaces }: { initialPlaces: DiscoveryPlace[] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [state, setState] = useState<LocationState>("idle");

  async function useLocation() {
    if (!("geolocation" in navigator)) {
      setState("unavailable");
      return;
    }

    setState("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: String(position.coords.latitude),
            lng: String(position.coords.longitude),
          });
          const response = await fetch(`/api/discovery/places?${params.toString()}`);
          if (!response.ok) throw new Error("Request failed");
          const payload = (await response.json()) as { places: DiscoveryPlace[] };
          setPlaces(payload.places);
          setState("available");
        } catch {
          setState("error");
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setState("denied");
        else setState("unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 10, timeout: 10000 },
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground min-[375px]:text-3xl sm:text-4xl">
            Popular near you
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Ranked by nearby distance when you share your location, then by approved photo
            coverage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={state === "loading"} onClick={useLocation} type="button" variant="secondary">
            <LocateFixed size={16} aria-hidden="true" />
            {state === "loading" ? "Finding places..." : "Use my location"}
          </Button>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold text-brand-strong transition hover:bg-sky-soft"
            href="/map"
          >
            View all
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <LocationMessage state={state} />
      {places.length ? (
        <div className="-mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {places.slice(0, 3).map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-line bg-white p-6">
          <h3 className="text-xl font-black">We&apos;re just getting started here.</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            No published places are ready for this view yet. You can help document nearby
            places and build the first real accessibility coverage.
          </p>
          <Link className="mt-4 inline-flex font-bold text-brand-strong underline" href="/places/add">
            Help put places on the map
          </Link>
        </div>
      )}
    </section>
  );
}

function LocationMessage({ state }: { state: LocationState }) {
  const messages: Partial<Record<LocationState, string>> = {
    available: "Showing places closest to the location shared by your browser.",
    denied: "Location access is off. You can still search or browse the map.",
    unavailable: "Your browser could not provide a location. Search or browse instead.",
    error: "Nearby places could not be refreshed right now. Search or browse instead.",
  };
  const message = messages[state];

  return message ? (
    <p className="mt-4 rounded-md bg-sky-soft px-3 py-2 text-sm text-brand-strong" role="status">
      {message}
    </p>
  ) : null;
}
