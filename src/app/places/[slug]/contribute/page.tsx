import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { PhotoUploader } from "@/components/contributions/photo-uploader";
import { requireCompletedProfile } from "@/lib/auth";
import { getManageablePlacePhotos, getPlacePageData } from "@/lib/places";
import { isPhotoCategory } from "@/lib/photo-categories";

export const metadata = {
  title: "Contribute Photos",
};

export default async function PlaceContributePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category } = await searchParams;
  const initialCategory = category && isPhotoCategory(category) ? category : undefined;
  const contributionPath = initialCategory
    ? `/places/${slug}/contribute?category=${encodeURIComponent(initialCategory)}`
    : `/places/${slug}/contribute`;
  const { user } = await requireCompletedProfile(contributionPath);
  const place = await getPlacePageData(slug);

  if (!place) notFound();

  if (!place.id) {
    redirect(`/places/${slug}`);
  }

  const photos = await getManageablePlacePhotos(place.id);

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-strong"
          href={`/places/${slug}`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to {place.name}
        </Link>
        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Contributor workflow
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Improve {place.name}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            Upload factual photos that help visitors understand entrances, thresholds,
            parking, routes, interiors, and other access details. Avoid faces, license
            plates, and private areas.
          </p>
        </div>
        <div className="mt-8">
          <PhotoUploader
            existingPhotos={photos}
            initialCategory={initialCategory}
            placeId={place.id}
            placeSlug={slug}
            userId={user.id}
          />
        </div>
      </section>
    </PageShell>
  );
}
