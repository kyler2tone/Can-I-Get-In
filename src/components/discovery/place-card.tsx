import { Camera, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import type { DiscoveryPlace } from "@/lib/discovery";

export function PlaceCard({ place }: { place: DiscoveryPlace }) {
  return (
    <Link
      className="group min-w-[280px] overflow-hidden rounded-[1.6rem] border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-xl focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
      href={place.url}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sky-soft">
        {place.thumbnailUrl ? (
          <Image
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-105"
            fill
            sizes="(min-width: 640px) 33vw, 280px"
            src={place.thumbnailUrl}
            unoptimized
          />
        ) : (
          <div className="grid size-full place-items-center px-5 text-center text-sm font-semibold text-brand-strong">
            Accessibility photos needed
          </div>
        )}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-foreground shadow">
          <Camera size={14} aria-hidden="true" />
          {place.approvedPhotoCount} {place.approvedPhotoCount === 1 ? "photo" : "photos"}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>{place.category ?? "Place"}</span>
          {place.city ? (
            <>
              <span aria-hidden="true">/</span>
              <span>{place.city}</span>
            </>
          ) : null}
        </div>
        <h3 className="mt-2 text-xl font-black">{place.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{place.address}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill outcome={place.currentEntryStatus} />
          {place.distanceMiles !== null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-brand-strong">
              <MapPin size={13} aria-hidden="true" />
              {formatDistance(place.distanceMiles)}
            </span>
          ) : null}
        </div>
        {place.currentSummary ? (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{place.currentSummary}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function formatDistance(distanceMiles: number) {
  if (distanceMiles < 0.1) return "Very close";
  if (distanceMiles < 10) return `${distanceMiles.toFixed(1)} mi`;
  return `${Math.round(distanceMiles)} mi`;
}
