import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { AccessibilityGlance } from "@/components/places/accessibility-glance";
import { PhotoGallery } from "@/components/places/photo-gallery";
import { SuggestUpdateForm } from "@/components/places/suggest-update-form";
import { getPublicAccessibilityIntelligence } from "@/lib/accessibility";
import { emptyAccessibilityObservations } from "@/lib/accessibility-factors";
import { getApprovedPlacePhotos, getPlacePageData } from "@/lib/places";
import { photoCategories } from "@/lib/photo-categories";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlacePageData(slug);
  return { title: place ? place.name : "Place" };
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlacePageData(slug);

  if (!place) notFound();

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
              <span className="text-sm text-muted">Last updated: {place.lastVerifiedAt}</span>
            </div>
            <ButtonLink className="mt-5 w-full lg:hidden" href={`/places/${slug}/contribute`}>
              <Camera size={18} aria-hidden="true" />
              Contribute photos
            </ButtonLink>
            <Suspense fallback={<AccessibilityGlanceSkeleton />}>
              <PlaceAccessibility placeId={place.id} />
            </Suspense>
            <Suspense fallback={<PhotoGallerySkeleton />}>
              <PlacePhotoGallery placeId={place.id} placeSlug={slug} />
            </Suspense>
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
              <p className="mt-3 text-xs leading-5 text-muted">
                Need to manage photos you uploaded? Select Help improve this place and scroll to Your uploaded photos.
              </p>
            </div>
            <div className="border border-line bg-surface p-5">
              <h2 className="text-lg font-semibold">Missing information</h2>
              {place.missingInformation.length ? (
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {place.missingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  Contributors can add photos to fill in the details visitors need.
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <ButtonLink href="/contribute" variant="secondary">
                <RefreshCw size={18} aria-hidden="true" />
                Request an update
              </ButtonLink>
            </div>
            <SuggestUpdateForm placeId={place.id} />
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

async function PlacePhotoGallery({ placeId, placeSlug }: { placeId: string; placeSlug: string }) {
  const photos = await getApprovedPlacePhotos(placeId);
  return <PhotoGallery photos={photos} placeSlug={placeSlug} />;
}

async function PlaceAccessibility({ placeId }: { placeId: string }) {
  let accessibility;

  try {
    accessibility = await getPublicAccessibilityIntelligence(placeId);
  } catch {
    return (
      <AccessibilityGlance
        observations={emptyAccessibilityObservations()}
        summary="Accessibility details could not be loaded right now. The rest of this place page is still available."
      />
    );
  }

  return (
    <AccessibilityGlance
      observations={accessibility.observations}
      summary={accessibility.publicSummary}
    />
  );
}

function AccessibilityGlanceSkeleton() {
  return (
    <section className="mt-8 border border-line bg-surface p-5" aria-labelledby="accessibility-glance-loading">
      <h2 id="accessibility-glance-loading" className="text-xl font-semibold">
        Accessibility at a glance
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, index) => (
          <div className="rounded-md border border-line bg-white p-3" key={index}>
            <div className="h-4 w-36 animate-pulse rounded bg-sky-soft" />
            <div className="mt-3 h-3 w-20 animate-pulse rounded bg-background" />
          </div>
        ))}
      </div>
      <div className="mt-5 border border-line bg-white p-4">
        <div className="h-4 w-44 animate-pulse rounded bg-sky-soft" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-background" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-background" />
      </div>
      <p className="sr-only" role="status">
        Loading accessibility details.
      </p>
    </section>
  );
}

function PhotoGallerySkeleton() {
  return (
    <section className="mt-5 border border-line bg-surface p-5" aria-labelledby="photo-gallery-loading">
      <h2 id="photo-gallery-loading" className="text-xl font-semibold">
        Community photos
      </h2>
      <p className="mt-2 text-sm text-muted">Loading community photos.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-hidden="true">
        <div className="h-52 animate-pulse rounded-md bg-white" />
        <div className="h-52 animate-pulse rounded-md bg-white" />
      </div>
    </section>
  );
}
