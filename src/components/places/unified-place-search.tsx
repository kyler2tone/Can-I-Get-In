"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placeCategories } from "@/lib/place-categories";

type ExistingPlace = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  category: string | null;
  publishStatus?: string;
  url: string;
  contributeUrl: string;
};

type GoogleSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
  suggestedCategory: string;
};

type LocationState = "idle" | "loading" | "available" | "unavailable" | "denied";

type CreateResponse = {
  status: "existing" | "created" | "pending";
  message: string;
  place: {
    name?: string;
    url?: string;
    contributeUrl: string;
  };
};

export function UnifiedPlaceSearch({
  initialQuery = "",
  onQueryChange,
  existingAction = "view",
}: {
  initialQuery?: string;
  onQueryChange?: (query: string, coordinates: { latitude: number; longitude: number } | null) => void;
  existingAction?: "view" | "contribute";
}) {
  const [query, setQuery] = useState(initialQuery);
  const [existingPlaces, setExistingPlaces] = useState<ExistingPlace[]>([]);
  const [googleResults, setGoogleResults] = useState<GoogleSuggestion[]>([]);
  const [existingState, setExistingState] = useState<"idle" | "loading" | "error">("idle");
  const [googleState, setGoogleState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [googleCategories, setGoogleCategories] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [sessionToken, setSessionToken] = useState(() => makeSessionToken());
  const router = useRouter();

  const normalizedQuery = query.trim();
  const canSearch = normalizedQuery.length >= 2;
  const isSearching = existingState === "loading" || googleState === "loading";

  useEffect(() => {
    const handle = window.setTimeout(() => {
      onQueryChange?.(normalizedQuery, location);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [location, normalizedQuery, onQueryChange]);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (!canSearch) {
        setExistingPlaces([]);
        setExistingState("idle");
        return;
      }

      setExistingState("loading");
      try {
        const params = new URLSearchParams({ q: normalizedQuery });
        const response = await fetch(`/api/places/search?${params.toString()}`);
        if (!response.ok) throw new Error("Search failed");
        const payload = (await response.json()) as { places: ExistingPlace[] };
        setExistingPlaces(payload.places);
        setExistingState("idle");
      } catch {
        setExistingPlaces([]);
        setExistingState("error");
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [canSearch, normalizedQuery]);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (!canSearch) {
        setGoogleResults([]);
        setGoogleState("idle");
        return;
      }

      setGoogleState("loading");
      try {
        const params = new URLSearchParams({
          input: normalizedQuery,
          sessionToken,
        });
        if (location) {
          params.set("lat", String(location.latitude));
          params.set("lng", String(location.longitude));
        }
        const response = await fetch(`/api/places/google?${params.toString()}`);
        const payload = (await response.json()) as { results?: GoogleSuggestion[]; message?: string };
        if (!response.ok) throw new Error(payload.message ?? "Place search is unavailable right now.");
        const results = payload.results ?? [];
        setGoogleResults(results);
        setGoogleCategories((current) => {
          const next = { ...current };
          for (const result of results) {
            if (!next[result.placeId]) next[result.placeId] = result.suggestedCategory || "Other";
          }
          return next;
        });
        setGoogleState("idle");
      } catch (error) {
        setGoogleResults([]);
        setGoogleState("error");
        setMessage(error instanceof Error ? error.message : "Place search is unavailable right now.");
      }
    }, 350);

    return () => window.clearTimeout(handle);
  }, [canSearch, location, normalizedQuery, sessionToken]);

  const googleOnlyResults = useMemo(() => {
    const existingNames = new Set(existingPlaces.map((place) => normalizeResultText(`${place.name} ${place.address}`)));
    return googleResults.filter((result) => !existingNames.has(normalizeResultText(result.fullText)));
  }, [existingPlaces, googleResults]);

  async function addGooglePlace(placeId: string) {
    const category =
      googleCategories[placeId] ??
      googleResults.find((result) => result.placeId === placeId)?.suggestedCategory ??
      "";
    if (!category) {
      setMessage("Choose a category for this place.");
      return;
    }

    setSelectedPlaceId(placeId);
    setMessage("Adding this place...");

    try {
      const response = await fetch("/api/places/google/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, sessionToken, category }),
      });
      const payload = (await response.json()) as Partial<CreateResponse> & { message?: string };
      if (!response.ok || !payload.place?.contributeUrl) {
        throw new Error(payload.message ?? "This place could not be added.");
      }

      router.push(payload.place.contributeUrl);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This place could not be added.");
      setSelectedPlaceId(null);
      setSessionToken(makeSessionToken());
    }
  }

  function useLocation() {
    if (!("geolocation" in navigator)) {
      setLocationState("unavailable");
      setMessage("Your browser does not support location. You can still include a city or address in your search.");
      return;
    }

    setLocationState("loading");
    setMessage("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(nextLocation);
        setLocationState("available");
        setMessage("Using your location to prefer nearby places.");
      },
      (error) => {
        setLocation(null);
        setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
        setMessage("Location is not available. You can still include a city or address in your search.");
      },
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 10, timeout: 10000 },
    );
  }

  return (
    <section aria-labelledby="place-search-heading" className="border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span id="place-search-heading" className="text-sm font-semibold">
            Search for a place
          </span>
          <span className="relative mt-1 block">
            <Search className="absolute left-3 top-3 text-muted" size={18} aria-hidden="true" />
            <input
              aria-controls="place-search-results"
              aria-describedby="place-search-help"
              className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Starbucks Rapid City or ARIA Las Vegas"
              type="search"
              value={query}
            />
          </span>
        </label>
        <Button disabled={locationState === "loading"} onClick={useLocation} type="button" variant="secondary">
          <LocateFixed size={16} aria-hidden="true" />
          {locationState === "loading" ? "Finding..." : locationState === "available" ? "Location on" : "Use my location"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted" id="place-search-help">
        Include a city or address for remote places. Location is optional and only helps nearby searches.
      </p>

      <div className="mt-4 grid gap-3" id="place-search-results" aria-live="polite">
        {!canSearch ? (
          <p className="rounded-md border border-dashed border-line bg-white p-4 text-sm text-muted">
            Start typing a place name, address, or city.
          </p>
        ) : null}
        {isSearching ? (
          <p className="rounded-md border border-dashed border-line bg-white p-4 text-sm text-muted">
            Searching places...
          </p>
        ) : null}
        {existingPlaces.map((place) => (
          <article className="border border-line bg-white p-4" key={place.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">On Can I Get In?</p>
                <h3 className="mt-1 font-semibold">{place.name}</h3>
                <p className="mt-1 text-sm text-muted">{place.address}</p>
                <p className="mt-1 text-xs font-semibold text-muted">
                  {[place.city, place.state, place.category].filter(Boolean).join(" · ")}
                </p>
              </div>
              <a
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-brand bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand active:translate-y-px"
                href={existingAction === "view" ? place.url : place.contributeUrl}
              >
                {existingAction === "view" ? "View accessibility info" : "Contribute photos"}
              </a>
            </div>
          </article>
        ))}
        {googleOnlyResults.map((result) => (
          <GoogleResultCard
            category={googleCategories[result.placeId] ?? result.suggestedCategory ?? "Other"}
            key={result.placeId}
            onCategoryChange={(category) =>
              setGoogleCategories((current) => ({ ...current, [result.placeId]: category }))
            }
            onSelect={() => void addGooglePlace(result.placeId)}
            result={result}
            selected={selectedPlaceId === result.placeId}
          />
        ))}
        {canSearch && !isSearching && !existingPlaces.length && !googleOnlyResults.length && googleState !== "error" ? (
          <p className="rounded-md border border-dashed border-line bg-white p-4 text-sm text-muted">
            We couldn&apos;t find that place. Try a fuller name or address, or submit it manually below.
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md bg-sky-soft px-3 py-2 text-sm text-brand-strong" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function GoogleResultCard({
  result,
  category,
  selected,
  onCategoryChange,
  onSelect,
}: {
  result: GoogleSuggestion;
  category: string;
  selected: boolean;
  onCategoryChange: (category: string) => void;
  onSelect: () => void;
}) {
  return (
    <article className="border border-line bg-white p-4 transition hover:border-brand focus-within:outline focus-within:outline-2 focus-within:outline-brand">
      <div className="flex items-start gap-3">
        <MapPin className="mt-1 shrink-0 text-brand" size={18} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Not on CIGI yet</p>
          <h3 className="mt-1 font-semibold">{result.primaryText}</h3>
          {result.secondaryText ? <p className="mt-1 text-sm text-muted">{result.secondaryText}</p> : null}
          <label className="mt-3 block text-sm font-medium">
            Category
            <select
              className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3"
              disabled={selected}
              onChange={(event) => onCategoryChange(event.target.value)}
              value={category}
            >
              <option value="">Choose a category</option>
              {placeCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <Button className="mt-3" disabled={selected || !category} onClick={onSelect} type="button">
            <Plus size={16} aria-hidden="true" />
            {selected ? "Adding..." : "Add this place"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function makeSessionToken() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function normalizeResultText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}
