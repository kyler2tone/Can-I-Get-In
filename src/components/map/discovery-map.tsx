"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import Link from "next/link";
import { Filter } from "lucide-react";
import { formatDistance } from "@/components/discovery/place-card";
import { Button } from "@/components/ui/button";
import { UnifiedPlaceSearch } from "@/components/places/unified-place-search";
import { placeCategories } from "@/lib/place-categories";
import { getUsState } from "@/lib/us-states";
import type { DiscoveryPlace } from "@/lib/discovery";

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
  initialState = "",
  initialCategory = "",
}: {
  initialPlaces: DiscoveryPlace[];
  initialQuery?: string;
  initialCity?: string;
  initialState?: string;
  initialCategory?: string;
}) {
  const [places, setPlaces] = useState(initialPlaces);
  const [query, setQuery] = useState(initialQuery);
  const [city] = useState(initialCity);
  const [stateContext] = useState(initialState);
  const stateBounds = stateContext ? getUsState(stateContext)?.bounds ?? null : null;
  const [category, setCategory] = useState(initialCategory);
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

    const center = mapCenter(validPlaces, userLocation, stateBounds);
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: discoveryMapStyle,
      center,
      zoom: stateBounds ? 5 : validPlaces.length ? 12 : 3,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [stateBounds, validPlaces, userLocation]);

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

    if (stateBounds && !userLocation && !city) {
      map.fitBounds(stateBounds, { padding: 32, duration: 500 });
    } else if (validPlaces.length) {
      const bounds = new maplibregl.LngLatBounds();
      validPlaces.forEach((place) => bounds.extend([place.longitude, place.latitude]));
      if (userLocation) bounds.extend([userLocation.longitude, userLocation.latitude]);
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 500 });
    }
  }, [city, stateBounds, validPlaces, userLocation]);

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

  const refreshPlaces = useCallback(async (next?: {
    latitude?: number;
    longitude?: number;
    query?: string;
    city?: string;
    state?: string;
    category?: string;
  }) => {
    const params = new URLSearchParams();
    const nextQuery = next?.query ?? query;
    const nextCity = next?.city ?? city;
    const nextState = next?.state ?? stateContext;
    const nextCategory = next?.category ?? category;
    const scopedToCity = Boolean(nextCity || nextState);
    const latitude = scopedToCity ? undefined : next?.latitude ?? userLocation?.latitude;
    const longitude = scopedToCity ? undefined : next?.longitude ?? userLocation?.longitude;

    if (latitude !== undefined && longitude !== undefined) {
      params.set("lat", String(latitude));
      params.set("lng", String(longitude));
    }
    if (nextQuery) params.set("q", nextQuery);
    if (nextCity) params.set("city", nextCity);
    if (nextState) params.set("state", nextState);
    if (nextCategory) params.set("category", nextCategory);

    const response = await fetch(`/api/discovery/places?${params.toString()}`);
    if (!response.ok) throw new Error("Request failed");
    const payload = (await response.json()) as { places: DiscoveryPlace[] };
    setPlaces(payload.places);
    setMessage(payload.places.length ? "" : "We couldn't find that place in the current map view.");
  }, [category, city, query, stateContext, userLocation]);

  async function handleSearch(formData: FormData) {
    const nextQuery = query;
    const nextCity = city;
    const nextCategory = String(formData.get("category") ?? "").trim();
    setCategory(nextCategory);
    setMessage("Searching places...");

    try {
      await refreshPlaces({ query: nextQuery, city: nextCity, state: stateContext, category: nextCategory });
    } catch {
      setMessage("Search is unavailable right now. You can still browse the places already shown.");
    }
  }

  const handleUnifiedQuery = useCallback(
    async (nextQuery: string, coordinates: { latitude: number; longitude: number } | null) => {
      setQuery(nextQuery);
      setUserLocation(coordinates);
      if (!nextQuery && !coordinates) return;

      try {
        await refreshPlaces({
          query: nextQuery,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
        });
      } catch {
        setMessage("Search is unavailable right now. You can still browse the places already shown.");
      }
    },
    [refreshPlaces],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-3">
          <UnifiedPlaceSearch
            existingAction="view"
            initialQuery={initialQuery}
            onQueryChange={handleUnifiedQuery}
          />
        </div>
        <form action={handleSearch} className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative">
            <span className="sr-only">Category filter</span>
            <Filter className="absolute left-3 top-3 text-muted" size={18} aria-hidden="true" />
            <select
              className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3"
              defaultValue={initialCategory}
              name="category"
            >
              <option value="">All</option>
              {placeCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Apply filter</Button>
        </form>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {city ? (
            <p className="rounded-md bg-white px-3 py-2 text-sm text-muted">
              Showing places around {city}.
            </p>
          ) : null}
          {!city && stateContext ? (
            <p className="rounded-md bg-white px-3 py-2 text-sm text-muted">
              Showing places in {getUsState(stateContext)?.name ?? stateContext}.
            </p>
          ) : null}
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

export function mapCenter(
  places: DiscoveryPlace[],
  userLocation: { latitude: number; longitude: number } | null,
  stateBounds: [[number, number], [number, number]] | null,
): [number, number] {
  if (userLocation) return [userLocation.longitude, userLocation.latitude];
  if (stateBounds) {
    return [
      (stateBounds[0][0] + stateBounds[1][0]) / 2,
      (stateBounds[0][1] + stateBounds[1][1]) / 2,
    ];
  }
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
