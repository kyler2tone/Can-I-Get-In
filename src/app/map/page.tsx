import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { RapidCityMap } from "@/components/map/rapid-city-map";
import { samplePlaces } from "@/lib/sample-data";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata = {
  title: "Rapid City Map",
};

export default function MapPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-3xl font-semibold">Rapid City map</h1>
          <p className="mt-2 text-muted">
            Phase 1 shows sample places for downtown Rapid City only.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-3 flex gap-2">
              <label className="relative flex-1">
                <span className="sr-only">Search places</span>
                <Search className="absolute left-3 top-3 text-muted" size={18} aria-hidden="true" />
                <input
                  className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3"
                  placeholder="Search Rapid City places"
                />
              </label>
              <button
                className="grid size-11 place-items-center rounded-md border border-line bg-surface"
                title="Filters placeholder"
                type="button"
              >
                <Filter size={18} aria-hidden="true" />
              </button>
            </div>
            <RapidCityMap places={samplePlaces} />
          </div>
          <aside className="space-y-3">
            <h2 className="text-lg font-semibold">Place previews</h2>
            {samplePlaces.length ? (
              samplePlaces.map((place) => (
                <Link
                  className="block border border-line bg-surface p-4 transition hover:border-brand"
                  href={`/places/${place.slug}`}
                  key={place.slug}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{place.name}</h3>
                      <p className="mt-1 text-sm text-muted">{place.address}</p>
                    </div>
                    <StatusPill outcome={place.currentEntryStatus} />
                  </div>
                </Link>
              ))
            ) : (
              <p className="border border-line bg-surface p-4 text-sm text-muted">
                No places match this search yet.
              </p>
            )}
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
