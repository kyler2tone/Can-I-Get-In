import {
  ArrowRight,
  Camera,
  Coffee,
  Hotel,
  Music2,
  ShoppingBag,
  Sparkles,
  Trees,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ExploreCities } from "@/components/discovery/explore-cities";
import { PopularNearYou } from "@/components/discovery/popular-near-you";
import { HomeHero } from "@/components/home/home-hero";
import { PageShell } from "@/components/page-shell";
import { findDiscoverablePlaces, getDiscoveryCities, getDiscoveryStats } from "@/lib/discovery";

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

export default async function Home() {
  const [places, cities, stats] = await Promise.all([
    findDiscoverablePlaces({ limit: 6 }),
    getDiscoveryCities(6),
    getDiscoveryStats(),
  ]);

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

      <PopularNearYou initialPlaces={places} />

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
            Your photos. Their next visit.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            Snap what people need to know before they arrive: entrances, routes, parking, patios,
            counters, restrooms, and the tiny details that make a trip feel possible.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              [formatNumber(stats.approvedPhotos), "Approved photos"],
              [formatNumber(stats.contributors), "Contributors"],
              [formatNumber(stats.places), "Places mapped"],
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

      <ExploreCities cities={cities} />
    </PageShell>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}
