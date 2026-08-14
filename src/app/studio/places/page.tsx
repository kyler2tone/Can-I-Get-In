import { PlaceReviewQueue } from "@/components/studio/place-review-queue";
import { getPendingStudioPlaces } from "@/lib/studio";

export const metadata = {
  title: "Place Review",
};

export default async function StudioPlacesPage() {
  const places = await getPendingStudioPlaces();

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        Places
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Pending place submissions</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted">
        Review manual places that need human confirmation before they appear in discovery.
      </p>
      <div className="mt-8">
        <PlaceReviewQueue places={places} />
      </div>
    </div>
  );
}
