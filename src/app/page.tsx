import { ArrowRight, Camera, MapPinned, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { samplePlaces } from "@/lib/sample-data";
import { StatusPill } from "@/components/ui/status-pill";

export default function Home() {
  return (
    <PageShell>
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Rapid City accessibility map
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Can I Get In?
            </h1>
            <p className="mt-3 text-2xl font-medium text-brand-strong">Know before you go.</p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              A mobile-first, community-powered map of factual accessibility observations for
              public places, starting in downtown Rapid City, South Dakota.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/map">
                <MapPinned size={18} aria-hidden="true" />
                Search the map
              </ButtonLink>
              <ButtonLink href="/contribute" variant="secondary">
                <Camera size={18} aria-hidden="true" />
                Contribute photos
              </ButtonLink>
            </div>
          </div>
          <div className="border border-line bg-background p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Rapid City progress</h2>
                <p className="mt-1 text-sm text-muted">Phase 1 sample records</p>
              </div>
              <ShieldCheck className="text-brand" aria-hidden="true" />
            </div>
            <div className="mt-5 space-y-3">
              {samplePlaces.map((place) => (
                <a
                  className="block border border-line bg-surface p-4 transition hover:border-brand"
                  href={`/places/${place.slug}`}
                  key={place.slug}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{place.name}</h3>
                      <p className="mt-1 text-sm text-muted">{place.category}</p>
                    </div>
                    <StatusPill outcome={place.currentEntryStatus} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        {[
          ["Describe visits", "Share what a visitor is likely to encounter, not legal labels."],
          ["Support with photos", "Document entrances, thresholds, parking, and routes."],
          ["Review before publishing", "AI observations will require human contributor review."],
        ].map(([title, body]) => (
          <div className="border border-line bg-surface p-5" key={title}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </div>
        ))}
      </section>
      <section className="bg-white/60 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Help make the first city useful.</h2>
            <p className="mt-2 text-muted">
              Community reports may be incomplete at launch. Every careful photo helps.
            </p>
          </div>
          <ButtonLink href="/auth/signup">
            Become a Contributor
            <ArrowRight size={18} aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>
    </PageShell>
  );
}
