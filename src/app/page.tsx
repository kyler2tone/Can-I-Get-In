import {
  ArrowRight,
  Camera,
  Coffee,
  Heart,
  Hotel,
  Music2,
  Navigation,
  ShoppingBag,
  Sparkles,
  Trees,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HomeHero } from "@/components/home/home-hero";
import { PageShell } from "@/components/page-shell";
import { formatEntryOutcome, samplePlaces } from "@/lib/sample-data";

const categories = [
  { label: "Restaurants", icon: Utensils, color: "text-[#ff6a3d]", href: "/map?category=restaurants" },
  { label: "Coffee", icon: Coffee, color: "text-[#006eff]", href: "/map?category=coffee" },
  { label: "Shopping", icon: ShoppingBag, color: "text-[#e14fb3]", href: "/map?category=shopping" },
  { label: "Parks", icon: Trees, color: "text-[#199a4b]", href: "/map?category=parks" },
  { label: "Hotels", icon: Hotel, color: "text-[#7b4ce2]", href: "/map?category=hotels" },
  { label: "Attractions", icon: Camera, color: "text-[#00a8b5]", href: "/map?category=attractions" },
  { label: "Nightlife", icon: Music2, color: "text-[#f5a400]", href: "/map?category=nightlife" },
  { label: "More", icon: Sparkles, color: "text-muted", href: "/map" },
];

const placeImages = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
];

const cities = [
  {
    name: "Rapid City",
    region: "South Dakota",
    places: "3,281 places",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Deadwood",
    region: "South Dakota",
    places: "842 places",
    image:
      "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Sioux Falls",
    region: "South Dakota",
    places: "1,892 places",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Denver",
    region: "Colorado",
    places: "4,102 places",
    image:
      "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Las Vegas",
    region: "Nevada",
    places: "2,945 places",
    image:
      "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Cheyenne",
    region: "Wyoming",
    places: "612 places",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
  },
];

const visibleCities = cities.slice(0, 5);

export default function Home() {
  return (
    <PageShell stickyHeader={false}>
      <HomeHero />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Start browsing</p>
            <h2 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">Explore by category</h2>
          </div>
          <Link
            className="hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold text-brand-strong transition hover:bg-sky-soft sm:inline-flex"
            href="/map"
          >
            View map
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="-mx-4 mt-6 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
          {categories.map(({ label, icon: Icon, color, href }) => (
            <Link
              className="group flex min-w-28 flex-col items-center justify-center gap-3 rounded-2xl px-4 py-4 text-center transition focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-brand"
              href={href}
              key={label}
            >
              <Icon
                className={`${color} transition-transform duration-200 motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:scale-[1.04]`}
                size={42}
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <span className="text-sm font-bold transition-colors group-hover:text-brand-strong">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-foreground min-[375px]:text-3xl sm:text-4xl">
            Popular near you
          </h2>
          <Link
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-sm font-bold text-brand-strong transition hover:bg-sky-soft min-[375px]:gap-2 min-[375px]:px-3"
            href="/map"
          >
            View all
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="-mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {samplePlaces.map((place, index) => (
            <Link
              className="group min-w-[280px] overflow-hidden rounded-[1.6rem] border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-xl focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
              href={`/places/${place.slug}`}
              key={place.slug}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  alt=""
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                  fill
                  sizes="(min-width: 640px) 33vw, 280px"
                  src={placeImages[index % placeImages.length]}
                />
                <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/92 text-brand shadow">
                  <Heart size={18} aria-hidden="true" />
                </span>
                <span className="absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-foreground shadow">
                  {index + 9} photos
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>{place.category}</span>
                  <span aria-hidden="true">/</span>
                  <span>{place.address.split(",").at(-2)?.trim() ?? "Nearby"}</span>
                </div>
                <h3 className="mt-2 text-xl font-black">{place.name}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eaf7ef] px-3 py-1 text-xs font-bold text-[#176b35]">
                    {formatEntryOutcome(place.currentEntryStatus)}
                  </span>
                  <span className="rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-brand-strong">
                    {place.communityConfidence} confidence
                  </span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{place.currentSummary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-sm">
          <Image
            alt=""
            className="size-full object-cover"
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=82"
          />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">Contributors</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-black leading-tight text-foreground sm:text-5xl">
            Your photos. Their confidence.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            Snap what people need to know before they arrive: entrances, routes, parking, patios,
            counters, restrooms, and the tiny details that make a trip feel possible.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["12,548", "Photos uploaded"],
              ["5,248", "Contributors"],
              ["24,193", "Places mapped"],
            ].map(([value, label]) => (
              <p className="border-t border-line pt-4" key={label}>
                <strong className="block text-3xl font-black text-brand">{value}</strong>
                <span className="text-sm font-bold text-muted">{label}</span>
              </p>
            ))}
          </div>
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
            href="/contribute"
          >
            Contribute now
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

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
        <div className="-mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {visibleCities.map((city) => (
            <Link
              className="group min-w-48 overflow-hidden rounded-[1.6rem] border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand lg:first:col-span-2"
              href={`/map?city=${encodeURIComponent(city.name)}`}
              key={`${city.name}-${city.region}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden lg:group-first:aspect-[8/5]">
                <Image
                  alt=""
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 192px"
                  src={city.image}
                />
              </div>
              <div className="p-4">
                <h3 className="font-black">{city.name}</h3>
                <p className="mt-1 text-sm text-muted">{city.region}</p>
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-strong">
                  <Navigation size={15} aria-hidden="true" />
                  {city.places}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
