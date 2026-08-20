import { ArrowRight, MapPinned } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getCitiesGroupedByState } from "@/lib/discovery";

export const metadata = {
  title: "Cities",
};

export default async function CitiesPage() {
  const groups = await getCitiesGroupedByState();

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Cities</p>
        <h1 className="mt-2 text-3xl font-semibold">Browse CIGI Coverage</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Cities appear here as community members add and document real places. Start coverage in a new area by adding a place in that state.
        </p>

        {groups.length ? (
          <div className="mt-8 grid gap-5">
            {groups.map((group) => (
              <section className="border border-line bg-surface p-5" key={group.state}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{stateName(group.state)}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {group.cities.length} covered {group.cities.length === 1 ? "city" : "cities"}
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-brand-strong transition hover:border-brand"
                    href={`/map?state=${encodeURIComponent(group.state)}`}
                  >
                    Add a Place in {stateName(group.state)}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {group.cities.map((city) => (
                    <Link
                      className="flex items-center gap-3 rounded-md border border-line bg-white p-3 transition hover:border-brand focus:outline focus:outline-2 focus:outline-brand"
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
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-line bg-surface p-6">
            <h2 className="text-xl font-semibold">No cities are covered yet.</h2>
            <p className="mt-2 text-sm text-muted">Add a place to start the first CIGI city page.</p>
            <Link className="mt-4 inline-flex font-semibold text-brand-strong underline" href="/map">
              Open the map
            </Link>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function stateName(value: string) {
  const names: Record<string, string> = {
    SD: "South Dakota",
    ND: "North Dakota",
    NE: "Nebraska",
    WY: "Wyoming",
    MT: "Montana",
    CO: "Colorado",
    NV: "Nevada",
  };

  return names[value] ?? value;
}
