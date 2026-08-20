"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Flag, MapPinned, MessageSquareWarning, Settings, UsersRound } from "lucide-react";
import type { StudioCounts } from "@/lib/studio";

const studioNavItems = [
  { href: "/studio/photos", label: "Photo Moderation", icon: Camera, enabled: true },
  { href: "/studio/places", label: "Places", icon: MapPinned, enabled: true },
  { href: "/studio/updates", label: "Suggested Updates", icon: MessageSquareWarning, enabled: true },
  { href: "/studio/contributors", label: "Contributors", icon: UsersRound, enabled: false },
  { href: "/studio/reports", label: "Reports", icon: Flag, enabled: false },
  { href: "/studio/settings", label: "Settings", icon: Settings, enabled: false },
];

export function StudioNav({
  counts = { pendingPhotos: 0, pendingPlaces: 0, pendingUpdates: 0 },
}: {
  counts?: StudioCounts;
}) {
  const [localCounts, setLocalCounts] = useState(counts);

  useEffect(() => {
    function onReviewed(event: Event) {
      const queue = event instanceof CustomEvent ? event.detail?.queue : null;
      setLocalCounts((current) => {
        if (queue === "photos") {
          return { ...current, pendingPhotos: Math.max(0, current.pendingPhotos - 1) };
        }
        if (queue === "places") {
          return { ...current, pendingPlaces: Math.max(0, current.pendingPlaces - 1) };
        }
        if (queue === "updates") {
          return { ...current, pendingUpdates: Math.max(0, current.pendingUpdates - 1) };
        }
        return current;
      });
    }

    window.addEventListener("studio:queue-reviewed", onReviewed);
    return () => window.removeEventListener("studio:queue-reviewed", onReviewed);
  }, []);

  return (
    <nav aria-label="Studio tools" className="border border-line bg-surface p-3">
      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-white" href="/studio">
        Studio Home
      </Link>
      <div className="mt-2 space-y-1">
        {studioNavItems.map((item) => {
          const Icon = item.icon;

          return item.enabled ? (
            <Link
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-white"
              href={item.href}
              key={item.href}
            >
              <Icon size={16} aria-hidden="true" />
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span>{item.label}</span>
                {pendingCount(item.href, localCounts) > 0 ? (
                  <span
                    className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white"
                    aria-label={`${pendingCount(item.href, localCounts)} items awaiting review`}
                  >
                    {pendingCount(item.href, localCounts)}
                  </span>
                ) : null}
              </span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted"
              key={item.href}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </span>
          );
        })}
      </div>
    </nav>
  );
}

function pendingCount(href: string, counts: StudioCounts) {
  if (href === "/studio/photos") return counts.pendingPhotos;
  if (href === "/studio/places") return counts.pendingPlaces;
  if (href === "/studio/updates") return counts.pendingUpdates;
  return 0;
}
