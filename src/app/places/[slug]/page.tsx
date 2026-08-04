import { notFound } from "next/navigation";
import { Camera, Flag, RefreshCw } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { PhotoGallery } from "@/components/places/photo-gallery";
import { formatEntryOutcome, samplePlaces } from "@/lib/sample-data";
import { getPlacePageData, getPlacePhotos } from "@/lib/places";
import { photoCategories } from "@/lib/photo-categories";
import type { EntryOutcome } from "@/lib/types";

export function generateStaticParams() {
  return samplePlaces.map((place) => ({ slug: place.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlacePageData(slug);
  return { title: place ? place.name : "Place" };
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlacePageData(slug);

  if (!place) notFound();

  const photos = await getPlacePhotos(place.id);
  const currentEntryStatus = place.currentEntryStatus as EntryOutcome;

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <article>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              {place.category}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{place.name}</h1>
            <p className="mt-2 text-muted">{place.address}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StatusPill outcome={currentEntryStatus} />
              <span className="text-sm text-muted">
                Community confidence: {place.communityConfidence}
              </span>
              <span className="text-sm text-muted">Last updated: {place.lastVerifiedAt}</span>
            </div>
            <section className="mt-8 border border-line bg-surface p-5">
              <h2 className="text-xl font-semibold">Current summary</h2>
              <p className="mt-3 leading-7 text-muted">{place.currentSummary}</p>
              <p className="mt-3 text-sm text-muted">
                Entry outcome shown as: {formatEntryOutcome(currentEntryStatus)}.
              </p>
            </section>
            <section className="mt-5 border border-line bg-surface p-5">
              <h2 className="text-xl font-semibold">Factual observations</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {place.observations.map((observation) => (
                  <div className="border border-line bg-white p-4" key={observation.label}>
                    <h3 className="font-semibold">{observation.label}</h3>
                    <p className="mt-1 text-sm text-muted">{observation.value}</p>
                    <p className="mt-2 text-xs text-muted">
                      {observation.confidence} confidence · {observation.source}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <PhotoGallery photos={photos} />
          </article>
          <aside className="space-y-5">
            <div className="border border-line bg-surface p-5">
              <h2 className="text-lg font-semibold">Photo categories</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {photoCategories.map((category) => (
                  <li key={category.value}>{category.label}</li>
                ))}
              </ul>
              <ButtonLink className="mt-5 w-full" href={`/places/${slug}/contribute`}>
                <Camera size={18} aria-hidden="true" />
                Help improve this place
              </ButtonLink>
            </div>
            <div className="border border-line bg-surface p-5">
              <h2 className="text-lg font-semibold">Missing information</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {place.missingInformation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3">
              <ButtonLink href="/contribute" variant="secondary">
                <RefreshCw size={18} aria-hidden="true" />
                Request an update
              </ButtonLink>
              <ButtonLink href="/contribute" variant="ghost">
                <Flag size={18} aria-hidden="true" />
                Flag a concern
              </ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
