import { ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getCurrentProfile, requireUser } from "@/lib/auth";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  await requireUser();
  const profile = await getCurrentProfile();
  const canModerate = profile?.role === "moderator" || profile?.role === "admin";

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="border border-line bg-surface p-6">
          <ShieldCheck className="text-brand" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-semibold">Moderation tools</h1>
          <p className="mt-3 leading-7 text-muted">
            Protected placeholder for future Moderator and Admin workflows. Full moderation
            queues are intentionally out of scope for Phase 1.
          </p>
          {!canModerate ? (
            <p className="mt-5 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-950">
              Your account is signed in but does not have Moderator or Admin permissions.
            </p>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
