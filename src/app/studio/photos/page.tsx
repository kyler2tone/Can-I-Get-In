import { PhotoModerationQueue } from "@/components/studio/photo-moderation-queue";
import { getPendingStudioPhotos } from "@/lib/studio";

export const metadata = {
  title: "Photo Moderation",
};

export default async function StudioPhotosPage() {
  const photos = await getPendingStudioPhotos();

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        Photo Moderation
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Pending photos</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted">
        Approve photos that clearly document accessibility details. Reject photos that are
        unsafe, unclear, unrelated, or not appropriate for public place pages.
      </p>
      <div className="mt-8">
        <PhotoModerationQueue photos={photos} />
      </div>
    </div>
  );
}
