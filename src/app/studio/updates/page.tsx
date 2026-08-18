import { UpdateRequestQueue } from "@/components/studio/update-request-queue";
import { getPendingStudioUpdateRequests } from "@/lib/studio";

export const metadata = {
  title: "Suggested Updates",
};

export default async function StudioUpdatesPage() {
  const updates = await getPendingStudioUpdateRequests();

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        Suggested Updates
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Contributor corrections</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted">
        Review corrections when Contributors believe published accessibility information is
        incomplete, incorrect, or outdated.
      </p>
      <div className="mt-8">
        <UpdateRequestQueue updates={updates} />
      </div>
    </div>
  );
}
