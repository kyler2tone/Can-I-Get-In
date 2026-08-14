"use client";

import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type HeroImage = {
  src: string;
  position: string;
};

const heroImages: HeroImage[] = [
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=82",
    position: "center",
  },
  {
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=82",
    position: "center",
  },
  {
    src: "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?auto=format&fit=crop&w=1800&q=82",
    position: "center",
  },
];

export function HomeHero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % heroImages.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  function moveSlide(direction: "previous" | "next") {
    setActiveIndex((index) => {
      if (direction === "previous") {
        return index === 0 ? heroImages.length - 1 : index - 1;
      }

      return (index + 1) % heroImages.length;
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="relative h-[430px] overflow-hidden rounded-[1.75rem] bg-foreground text-white shadow-[0_18px_54px_rgba(7,22,56,0.16)] sm:h-[470px] lg:h-[500px]">
        {heroImages.map((image, index) => (
          <Image
            alt=""
            aria-hidden="true"
            className={`size-full object-cover transition-opacity duration-700 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            fill
            key={image.src}
            priority={index === 0}
            sizes="(min-width: 1280px) 1200px, 100vw"
            src={image.src}
            style={{ objectPosition: image.position }}
          />
        ))}

        <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end px-5 pb-16 pt-20 sm:px-9 sm:pb-20 lg:px-12">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Can I Get In?</p>
          <h1 className="mt-3 max-w-2xl text-5xl font-black leading-[0.96] [text-shadow:_0_2px_18px_rgb(0_0_0_/_45%)] sm:text-6xl lg:text-7xl">
            Where are you headed?
          </h1>
          <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-white [text-shadow:_0_2px_14px_rgb(0_0_0_/_45%)]">
            Search places and cities with community accessibility notes, photos, and confidence
            before you go.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <form
              action="/map"
              className="flex min-h-12 overflow-hidden rounded-full bg-white text-foreground shadow-lg focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white sm:min-w-[390px]"
            >
              <label className="sr-only" htmlFor="homepage-search">
                Search places or cities
              </label>
              <Search className="ml-4 mt-3.5 shrink-0 text-muted" size={18} aria-hidden="true" />
              <input
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted"
                id="homepage-search"
                name="q"
                placeholder="Search places or cities..."
                type="search"
              />
              <button className="m-1 rounded-full bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-strong">
                Search
              </button>
            </form>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-strong shadow-lg transition hover:bg-sky-soft focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
              href="/map"
            >
              Explore places
            </Link>
          </div>
        </div>

        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
          <button
            aria-label="Previous hero image"
            className="grid size-10 place-items-center rounded-full bg-white text-brand-strong shadow-lg transition hover:bg-sky-soft focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
            onClick={() => moveSlide("previous")}
            type="button"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            aria-label="Next hero image"
            className="grid size-10 place-items-center rounded-full bg-white text-brand-strong shadow-lg transition hover:bg-sky-soft focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
            onClick={() => moveSlide("next")}
            type="button"
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2 sm:left-9">
          <span className="sr-only">
            Hero image {activeIndex + 1} of {heroImages.length}
          </span>
          {heroImages.map((image, index) => (
            <button
              aria-label={`Show hero image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`h-2.5 rounded-full bg-white transition-all focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white ${
                index === activeIndex ? "w-8" : "w-2.5 opacity-65 hover:opacity-90"
              }`}
              key={image.src}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
