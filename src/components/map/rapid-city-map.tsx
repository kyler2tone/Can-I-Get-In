"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Place } from "@/lib/types";

export function RapidCityMap({ places }: { places: Place[] }) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-103.231, 44.0805],
      zoom: 13,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    places.forEach((place) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className =
        "grid size-9 place-items-center rounded-full border-2 border-white bg-brand text-white shadow-md";
      marker.ariaLabel = place.name;
      marker.textContent = "•";

      new maplibregl.Marker({ element: marker })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 18 }).setHTML(
            `<strong>${place.name}</strong><br/><span>${place.address}</span>`,
          ),
        )
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [places]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] min-h-[360px] w-full overflow-hidden border border-line bg-sky-soft md:h-[620px]"
      aria-label="Map centered on Rapid City, South Dakota"
    />
  );
}
