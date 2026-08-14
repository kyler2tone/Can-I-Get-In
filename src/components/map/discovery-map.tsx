"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import Link from "next/link";
import { Filter, LocateFixed, Search } from "lucide-react";
import { formatDistance } from "@/components/discovery/place-card";
import { Button } from "@/components/ui/button";
import type { DiscoveryPlace } from "@/lib/discovery";

type LocationState = "idle" | "loading" | "available" | "denied" | "unavailable" | "error";

const discoveryMapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    cartoLight: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-light",
      type: "raster",
      source: "cartoLight",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function DiscoveryMap({
  initialPlaces,
  initialQuery = "",
  initialCity = "",
  initialCategory = "",
}: {
  initialPlaces: DiscoveryPlace[];
  initialQuery?: string;
  initialCity?: string;
  initialCategory?: string;
}) {
  const [places, setPlaces] = useState(initialPlaces);
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [message, setMessage] = useState("");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const validPlaces = useMemo(
    () =>
      places.filter(
        (place) =>
          Number.isFinite(place.latitude) &&
          Number.isFinite(place.longitude) &&
          place.latitude >= -90 &&
          place.latitude <= 90 &&
          place.longitude >= -180 &&
          place.longitude <= 180,
      ),
    [places],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = mapCenter(validPlaces, userLocation);
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: discoveryMapStyle,
      center,
      zoom: validPlaces.length ? 12 : 3,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [validPlaces, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = validPlaces.map((place) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className =
        "grid size-9 place-items-center rounded-full border-2 border-white bg-brand text-white shadow-md transition hover:scale-105 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand";
      markerElement.setAttribute("aria-label", `Open ${place.name} preview`);
      markerElement.textContent = "";

      return new maplibregl.Marker({ element: markerElement })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new maplibregl.Popup({ closeButton: true, offset: 18, maxWidth: "280px" }).setHTML(
            popupHtml(place),
          ),
        )
        .addTo(map);
    });

    if (validPlaces.length) {
      const bounds = new maplibregl.LngLatBounds();
      validPlaces.forEach((place) => bounds.extend([place.longitude, place.latitude]));
      if (userLocation) bounds.extend([userLocation.longitude, userLocation.latitude]);
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 500 });
    }
  }, [validPlaces, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    userMarkerRef.current?.remove();
    const markerElement = document.createElement("div");
    markerElement.className = "size-4 rounded-full border-2 border-white bg-accent shadow-md";
    userMarkerRef.current = new maplibregl.Marker({ element: markerElement })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map);
  }, [userLocation]);

  async function refreshPlaces(next?: {
    latitude?: number;
    longitude?: number;
    query?: string;
    city?: string;
    category?: string;
  }) {
    const params = new URLSearchParams();
    const nextQuery = next?.query ?? query;
    const nextCity = next?.city ?? city;
    const nextCategory = next?.category ?? category;
    const latitude = next?.latitude ?? userLocation?.latitude;
    const longitude = next?.longitude ?? userLocation?.longitude;

    if (latitude !== undefined && longitude !== undefined) {
      params.set("lat", String(latitude));
      params.set("lng", String(longitude));
    }
    if (nextQuery) params.set("q", nextQuery);
    if (nextCity) params.set("city", nextCity);
    if (nextCategory) params.set("category", nextCategory);

    const response = await fetch(`/api/discovery/places?${params.toString()}`);
    if (!response.ok) throw new Error("Request failed");
    const payload = (await response.json()) as { places: DiscoveryPlace[] };
    setPlaces(payload.places);
    setMessage(payload.places.length ? "" : "No places match that search yet.");
  }

  async function handleSearch(formData: FormData) {
    const nextQuery = String(formData.get("q") ?? "").trim();
    const nextCity = String(formData.get("city") ?? "").trim();
    const nextCategory = String(formData.get("category") ?? "").trim();
    setQuery(nextQuery);
    setCity(nextCity);
    setCategory(nextCategory);
    setMessage("Searching places...");

    try {
      await refreshPlaces({ query: nextQuery, city: nextCity, category: nextCategory });
    } catch {
      setMessage("Search is unavailable right now. You can still browse the places already shown.");
    }
  }

  function useLocation() {
    if (!("geolocation" in navigator)) {
      setLocationState("unavailable");
      setMessage("Your browser does not support location. Search or browse instead.");
      return;
    }

    setLocationState("loading");
    setMessage("Finding nearby places...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(coordinates);

        try {
          await refreshPlaces(coordinates);
          setLocationState("available");
          setMessage("Showing places closest to the location shared by your browser.");
        } catch {
          setLocationState("error");
          setMessage("Nearby places could not be refreshed right now. Search or browse instead.");
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationState("denied");
          setMessage("Location access is off. Search or browse the map instead.");
        } else {
          setLocationState("unavailable");
          setMessage("Your browser could not provide a location. Search or browse instead.");
        }
      },
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 10, timeout: 10000 },
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <form action={handleSearch} className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px_160px_auto]">
          <label className="relative">
            <span className="sr-only">Search places</span>
            <Search className="absolute left-3 top-3 text-muted" size={18} aria-hidden="true" />
            <input
              className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3"
              defaultValue={initialQuery}
              name="q"
              placeholder="Search places"
              type="search"
            />
          </label>
          <label>
            <span className="sr-only">City</span>
            <input
              className="h-11 w-full rounded-md border border-line bg-white px-3"
              defaultValue={initialCity}
              name="city"
              placeholder="City"
              type="search"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Category</span>
            <Filter className="absolute left-3 top-3 text-muted" size={18} aria-hidden="true" />
            <input
              className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3"
              defaultValue={initialCategory}
              name="category"
              placeholder="Category"
              type="search"
            />
          </label>
          <Button type="submit">Search</Button>
        </form>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button disabled={locationState === "loading"} onClick={useLocation} type="button" variant="secondary">
            <LocateFixed size={16} aria-hidden="true" />
            {locationState === "loading" ? "Finding places..." : "Use my location"}
          </Button>
          {message ? (
            <p className="rounded-md bg-sky-soft px-3 py-2 text-sm text-brand-strong" role="status">
              {message}
            </p>
          ) : null}
        </div>
        <div
          ref={containerRef}
          className="h-[420px] min-h-[360px] w-full overflow-hidden border border-line bg-sky-soft md:h-[620px]"
          aria-label="Map showing published places"
        />
      </div>
      <aside className="space-y-3">
        <h2 className="text-lg font-semibold">Places</h2>
        {places.length ? (
          <div className="grid gap-3">
            {places.map((place) => (
              <Link
                className="block border border-line bg-surface p-4 transition hover:border-brand focus:outline focus:outline-2 focus:outline-brand"
                href={place.url}
                key={place.id}
              >
                <div>
                  <h3 className="font-semibold">{place.name}</h3>
                  <p className="mt-1 text-sm text-muted">{place.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                    {place.category ? <span>{place.category}</span> : null}
                    {place.distanceMiles !== null ? <span>{formatDistance(place.distanceMiles)}</span> : null}
                    <span>{place.approvedPhotoCount} approved photos</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-line bg-surface p-4">
            <p className="text-sm text-muted">No places match this search yet.</p>
            <Link className="mt-3 inline-flex text-sm font-bold text-brand-strong underline" href="/places/add">
              Add a missing place
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function mapCenter(
  places: DiscoveryPlace[],
  userLocation: { latitude: number; longitude: number } | null,
): [number, number] {
  if (userLocation) return [userLocation.longitude, userLocation.latitude];
  const firstPlace = places[0];
  if (firstPlace) return [firstPlace.longitude, firstPlace.latitude];
  return [-98.5795, 39.8283];
}

function popupHtml(place: DiscoveryPlace) {
  return `
    <article style="font-family: Arial, Helvetica, sans-serif;">
      ${
        place.thumbnailUrl
          ? `<img alt="" src="${escapeHtml(place.thumbnailUrl)}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
          : ""
      }
      <h3 style="margin:0 0 4px;font-size:16px;">${escapeHtml(place.name)}</h3>
      <p style="margin:0 0 6px;color:#58677f;font-size:13px;">${escapeHtml(place.category ?? "Place")}</p>
      <p style="margin:0 0 10px;color:#58677f;font-size:13px;">${escapeHtml(place.address)}</p>
      <a href="${escapeHtml(place.url)}" style="font-weight:700;color:#073a9b;">Open place</a>
    </article>
  `;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] ?? character;
  });
}
