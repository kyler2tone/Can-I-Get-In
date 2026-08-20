import { DiscoveryMap } from "@/components/map/discovery-map";
import { PageShell } from "@/components/page-shell";
import { findDiscoverablePlaces } from "@/lib/discovery";

export const metadata = {
  title: "Explore Places",
};

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; state?: string; category?: string }>;
}) {
  const { q = "", city = "", state = "", category = "" } = await searchParams;
  const places = await findDiscoverablePlaces({
    query: q,
    city,
    state,
    category,
    limit: 60,
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-3xl font-semibold">Explore places</h1>
          <p className="mt-2 text-muted">
            Search real community place records, share your location when you want nearby
            results, or browse the list without using the map.
          </p>
        </div>
        <DiscoveryMap
          initialCategory={category}
          initialCity={city}
          initialState={state}
          initialPlaces={places}
          initialQuery={q}
        />
      </section>
    </PageShell>
  );
}
