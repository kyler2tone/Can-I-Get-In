"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LocateFixed, MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExistingPlace = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  category: string | null;
  contributeUrl: string;
};

type GoogleSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
};

type CreateResponse = {
  status: "existing" | "created" | "pending";
  message: string;
  place: {
    name?: string;
    contributeUrl: string;
  };
};

const categoryOptions = [
  "Restaurant",
  "Coffee shop",
  "Store",
  "Grocery store",
  "Medical office",
  "Public building",
  "Hotel",
  "Entertainment",
  "Park",
  "Other",
];

export function AddPlaceWorkflow() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [existingPlaces, setExistingPlaces] = useState<ExistingPlace[]>([]);
  const [googleResults, setGoogleResults] = useState<GoogleSuggestion[]>([]);
  const [message, setMessage] = useState("");
  const [existingState, setExistingState] = useState<"idle" | "loading" | "error">("idle");
  const [googleState, setGoogleState] = useState<"idle" | "loading" | "error">("idle");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [manualState, setManualState] = useState<"idle" | "submitting" | "locating">("idle");
  const [manualMessage, setManualMessage] = useState("");
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchLocationState, setSearchLocationState] = useState<
    "idle" | "loading" | "available" | "unavailable"
  >("idle");
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());
  const router = useRouter();

  const canSearchGoogle = query.trim().length >= 2;

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      const searchQuery = query.trim();
      const searchCity = city.trim();

      if (searchQuery.length < 2 && searchCity.length < 2) {
        setExistingPlaces([]);
        setExistingState("idle");
        return;
      }

      setExistingState("loading");
      try {
        const params = new URLSearchParams();
        params.set("q", searchQuery);
        params.set("city", searchCity);
        const response = await fetch(`/api/places/search?${params.toString()}`);
        if (!response.ok) throw new Error("Search failed");
        const payload = (await response.json()) as { places: ExistingPlace[] };
        setExistingPlaces(payload.places);
        setExistingState("idle");
      } catch {
        setExistingState("error");
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query, city]);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (!canSearchGoogle) {
        setGoogleResults([]);
        setGoogleState("idle");
        return;
      }

      setGoogleState("loading");
      try {
        const params = new URLSearchParams({
          input: query.trim(),
          sessionToken,
        });
        if (city.trim()) {
          params.set("city", city.trim());
        } else if (searchLocation) {
          params.set("lat", String(searchLocation.latitude));
          params.set("lng", String(searchLocation.longitude));
        }
        const response = await fetch(`/api/places/google?${params.toString()}`);
        const payload = (await response.json()) as { results?: GoogleSuggestion[]; message?: string };
        if (!response.ok) throw new Error(payload.message ?? "Google search failed");
        setGoogleResults(payload.results ?? []);
        setGoogleState("idle");
      } catch (error) {
        setGoogleResults([]);
        setGoogleState("error");
        setMessage(error instanceof Error ? error.message : "Place lookup is unavailable right now.");
      }
    }, 350);

    return () => window.clearTimeout(handle);
  }, [query, city, canSearchGoogle, searchLocation, sessionToken]);

  async function addGooglePlace(placeId: string) {
    setSelectedPlaceId(placeId);
    setMessage("Checking this place...");

    try {
      const response = await fetch("/api/places/google/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, sessionToken }),
      });
      const payload = (await response.json()) as Partial<CreateResponse> & { message?: string };
      if (!response.ok || !payload.place?.contributeUrl) {
        throw new Error(payload.message ?? "This place could not be added.");
      }

      setMessage(payload.message ?? "Place ready.");
      router.push(payload.place.contributeUrl);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This place could not be added.");
      setSelectedPlaceId(null);
      setSessionToken(crypto.randomUUID());
    }
  }

  async function submitManualPlace(formData: FormData) {
    setManualState("submitting");
    setManualMessage("Submitting place for review...");

    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/places/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as Partial<CreateResponse> & { message?: string };
      if (!response.ok || !result.place?.contributeUrl) {
        throw new Error(result.message ?? "This place could not be submitted.");
      }

      setManualMessage(result.message ?? "Place submitted.");
      router.push(result.place.contributeUrl);
      router.refresh();
    } catch (error) {
      setManualMessage(error instanceof Error ? error.message : "This place could not be submitted.");
      setManualState("idle");
    }
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setManualMessage("Your browser does not support location sharing.");
      return;
    }

    setManualState("locating");
    setManualMessage("Finding your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = document.getElementById("manual-latitude") as HTMLInputElement | null;
        const longitude = document.getElementById("manual-longitude") as HTMLInputElement | null;
        if (latitude) latitude.value = position.coords.latitude.toFixed(6);
        if (longitude) longitude.value = position.coords.longitude.toFixed(6);
        setManualMessage("Location added. Adjust it if the place is somewhere else.");
        setManualState("idle");
      },
      () => {
        setManualMessage("Location could not be added. You can enter coordinates manually.");
        setManualState("idle");
      },
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 10, timeout: 10000 },
    );
  }

  function useSearchLocation() {
    if (!("geolocation" in navigator)) {
      setSearchLocationState("unavailable");
      setMessage("Your browser does not support location sharing. You can enter a city instead.");
      return;
    }

    setSearchLocationState("loading");
    setMessage("Finding your location for search...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setSearchLocationState("available");
        setMessage(
          city.trim()
            ? "City search is active, so browser location will not change these results."
            : "Using your location to prefer nearby verified places.",
        );
      },
      () => {
        setSearchLocationState("unavailable");
        setMessage("Location could not be added. You can enter a city instead.");
      },
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 10, timeout: 10000 },
    );
  }

  const emptyExistingMessage = useMemo(() => {
    if (existingState === "loading") return "Searching Can I Get In?...";
    if (existingState === "error") return "Existing place search is unavailable right now.";
    if (query.trim().length < 2 && city.trim().length < 2) return "Start by searching for the place.";
    return "No matching Can I Get In? place found yet.";
  }, [city, existingState, query]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Search existing places first</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            If this place is already here, jump straight into the photo contribution flow.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px]">
            <label>
              <span className="text-sm font-medium">Place name or address</span>
              <span className="relative mt-1 block">
                <Search className="absolute left-3 top-3 text-muted" size={18} aria-hidden="true" />
                <input
                  className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Main Street Cafe"
                  type="search"
                  value={query}
                />
              </span>
            </label>
            <label>
              <span className="text-sm font-medium">City</span>
              <input
                className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3"
                onChange={(event) => setCity(event.target.value)}
                placeholder="Rapid City"
                type="search"
                value={city}
              />
            </label>
          </div>
          <div className="mt-5 grid gap-3" aria-live="polite">
            {existingPlaces.length ? (
              existingPlaces.map((place) => (
                <article className="border border-line bg-white p-4" key={place.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{place.name}</h3>
                      <p className="mt-1 text-sm text-muted">{place.address}</p>
                      <p className="mt-1 text-xs font-semibold text-muted">
                        {[place.city, place.state, place.category].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <a
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-brand bg-brand px-3 py-2 text-sm font-semibold text-white"
                      href={place.contributeUrl}
                    >
                      Contribute
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-line bg-white p-4 text-sm text-muted">
                {emptyExistingMessage}
              </p>
            )}
          </div>
        </section>

        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Add a verified place</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Choose a real-world result, then we will create the place and send you to photo upload.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              disabled={searchLocationState === "loading"}
              onClick={useSearchLocation}
              type="button"
              variant="secondary"
            >
              <LocateFixed size={16} aria-hidden="true" />
              {searchLocationState === "loading" ? "Finding location..." : "Use my location for search"}
            </Button>
            <p className="text-xs text-muted">
              Typed city or location takes priority over browser location.
            </p>
          </div>
          <div className="mt-5 grid gap-3" aria-live="polite">
            {googleState === "loading" ? (
              <p className="rounded-md border border-dashed border-line bg-white p-4 text-sm text-muted">
                Looking up places...
              </p>
            ) : null}
            {googleResults.map((result) => (
              <button
                className="w-full border border-line bg-white p-4 text-left transition hover:border-brand focus:outline focus:outline-2 focus:outline-brand"
                disabled={selectedPlaceId === result.placeId}
                key={result.placeId}
                onClick={() => void addGooglePlace(result.placeId)}
                type="button"
              >
                <span className="flex items-start gap-3">
                  <MapPin className="mt-1 text-brand" size={18} aria-hidden="true" />
                  <span>
                    <span className="block font-semibold">{result.primaryText}</span>
                    {result.secondaryText ? (
                      <span className="mt-1 block text-sm text-muted">{result.secondaryText}</span>
                    ) : null}
                    <span className="mt-2 block text-xs font-semibold text-brand-strong">
                      {selectedPlaceId === result.placeId ? "Adding..." : "Select this place"}
                    </span>
                  </span>
                </span>
              </button>
            ))}
            {canSearchGoogle && googleState !== "loading" && !googleResults.length ? (
              <p className="rounded-md border border-dashed border-line bg-white p-4 text-sm text-muted">
                No verified place results found. You can submit it manually below.
              </p>
            ) : null}
            <p className="text-xs font-semibold text-muted">Place search results provided by Google.</p>
            {message ? (
              <p className="rounded-md bg-sky-soft px-3 py-2 text-sm text-brand-strong">{message}</p>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Can&apos;t find it?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Manual submissions go to Studio review before public discovery, but you can add photos right away.
          </p>
          <form action={submitManualPlace} className="mt-5 space-y-3">
            <TextField label="Place name" name="name" required />
            <TextField label="Address or location" name="address" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="City" name="city" required />
              <TextField label="State" name="state" required />
            </div>
            <TextField label="Postal code" name="postalCode" />
            <label className="block">
              <span className="text-sm font-medium">Category</span>
              <select
                className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3"
                name="category"
                required
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id="manual-latitude" label="Latitude" name="latitude" required />
              <TextField id="manual-longitude" label="Longitude" name="longitude" required />
            </div>
            <Button
              disabled={manualState === "locating" || manualState === "submitting"}
              onClick={useCurrentLocation}
              type="button"
              variant="secondary"
            >
              <LocateFixed size={16} aria-hidden="true" />
              Use my location
            </Button>
            <TextField label="Website" name="website" type="url" />
            <label className="block">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-line bg-white px-3 py-2"
                maxLength={500}
                name="notes"
              />
            </label>
            {manualMessage ? (
              <p className="rounded-md bg-sky-soft px-3 py-2 text-sm text-brand-strong" role="status">
                {manualMessage}
              </p>
            ) : null}
            <Button className="w-full" disabled={manualState === "submitting"} type="submit">
              <Plus size={16} aria-hidden="true" />
              {manualState === "submitting" ? "Submitting..." : "Submit and add photos"}
            </Button>
          </form>
        </section>
        <section className="border border-line bg-white p-5">
          <CheckCircle2 className="text-brand" size={22} aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold">What happens next?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Verified places publish immediately. Manual places stay out of public discovery until a moderator reviews them.
          </p>
        </section>
      </aside>
    </div>
  );
}

function TextField({
  label,
  name,
  id,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  id?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3"
        id={id}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}
