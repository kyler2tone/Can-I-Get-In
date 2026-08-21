import { ArrowRight, MapPinned } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getCitiesGroupedByState } from "@/lib/discovery";
import { usStates } from "@/lib/us-states";

export const metadata = {
  title: "Cities",
};

export default async function CitiesPage() {
  const groups = await getCitiesGroupedByState();
  const citiesByState = new Map(groups.map((group) => [group.state.toUpperCase(), group.cities]));

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Cities</p>
        <h1 className="mt-2 text-3xl font-semibold">Browse CIGI Coverage</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Cities appear here as community members add and document real places. Start coverage in a new area by adding a place in that state.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {usStates.map((state) => {
            const cities = citiesByState.get(state.code) ?? [];

            return (
              <section className="min-w-0 border border-line bg-surface p-5" key={state.code}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{state.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {cities.length ? `${cities.length} covered ${cities.length === 1 ? "city" : "cities"}` : "No CIGI cities yet"}
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-normal rounded-md border border-line bg-white px-4 py-2 text-center text-sm font-semibold text-brand-strong transition hover:border-brand"
                    href={`/map?state=${encodeURIComponent(state.code)}`}
                  >
                    Add a Place in {state.name}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
                {cities.length ? (
                  <div className="mt-4 grid gap-3">
                    {cities.map((city) => (
                      <Link
                        className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-white p-3 transition hover:border-brand focus:outline focus:outline-2 focus:outline-brand"
                        href={`/map?city=${encodeURIComponent(`${city.name}, ${city.state}`)}`}
                        key={city.slug}
                      >
                        <MapPinned className="text-brand" size={18} aria-hidden="true" />
                        <span>
                          <span className="block font-semibold">{city.name}</span>
                          <span className="text-sm text-muted">
                            {city.placeCount} {city.placeCount === 1 ? "place" : "places"}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
