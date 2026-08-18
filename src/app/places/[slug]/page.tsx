import { notFound } from "next/navigation";
import { Camera, RefreshCw } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { AccessibilityGlance } from "@/components/places/accessibility-glance";
import { PhotoGallery } from "@/components/places/photo-gallery";
import { SuggestUpdateForm } from "@/components/places/suggest-update-form";
import { getPublicAccessibilityIntelligence } from "@/lib/accessibility";
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

  const photos = await getApprovedPlacePhotos(place.id);
  const accessibility = await getPublicAccessibilityIntelligence(place.id);

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
            <AccessibilityGlance
              observations={accessibility.observations}
              summary={accessibility.publicSummary}
            />
            <PhotoGallery photos={photos} placeSlug={slug} />
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
