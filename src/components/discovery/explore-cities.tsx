import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import type { DiscoveryCity } from "@/lib/discovery";

export function ExploreCities({ cities }: { cities: DiscoveryCity[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8" id="explore-cities">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Destinations</p>
          <h2 className="mt-2 text-2xl font-black text-foreground min-[375px]:text-3xl sm:text-4xl">
            Explore cities
          </h2>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-sm font-bold text-brand-strong transition hover:bg-sky-soft min-[375px]:gap-2 min-[375px]:px-3"
          href="/map"
        >
          View all cities
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {cities.length ? (
        <div className="-mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {cities.map((city) => (
            <Link
              className="group min-w-48 rounded-[1.6rem] border border-line bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand lg:first:col-span-2"
              href={`/map?city=${encodeURIComponent(`${city.name}, ${city.state}`)}`}
              key={city.slug}
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-sky-soft text-brand-strong">
                <MapPin size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-black">{city.name}</h3>
              <p className="mt-1 text-sm text-muted">{city.state}</p>
              <p className="mt-3 text-sm font-bold text-brand-strong">
                {city.placeCount} {city.placeCount === 1 ? "place" : "places"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {city.approvedPhotoCount} approved{" "}
                {city.approvedPhotoCount === 1 ? "photo" : "photos"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-line bg-white p-6">
          <h3 className="text-xl font-black">Help put your city on the map.</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            City discovery will grow as real places are added and documented by the community.
          </p>
          <Link className="mt-4 inline-flex font-bold text-brand-strong underline" href="/places/add">
            Start contributing
          </Link>
        </div>
      )}
    </section>
  );
}
