import { MapPinned } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { AddPlaceWorkflow } from "@/components/places/add-place-workflow";
import { requireCompletedProfile } from "@/lib/auth";

export const metadata = {
  title: "Add a Place",
};

export default async function AddPlacePage() {
  await requireCompletedProfile("/places/add");

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Add a Place
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Put a missing place on the map</h1>
          <p className="mt-3 text-lg leading-8 text-muted">
            Search Can I Get In? first, choose a verified place when possible, then add
            accessibility photos without re-searching.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-brand-strong">
            <MapPinned size={16} aria-hidden="true" />
            Search, choose, contribute
          </div>
        </div>
        <AddPlaceWorkflow />
      </section>
    </PageShell>
  );
}
