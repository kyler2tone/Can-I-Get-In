import Link from "next/link";
import { Award, MapPinned, Pencil, Trophy } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { requireUser, getCurrentProfile } from "@/lib/auth";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">
              {profile?.display_name || "Contributor dashboard"}
            </h1>
            <p className="mt-2 text-muted">Track your accessibility mapping contributions.</p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold"
            href="/settings/profile"
          >
            <Pencil size={16} aria-hidden="true" />
            Edit profile
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Points", profile?.points ?? 0, Trophy],
            ["Contributions", profile?.contribution_count ?? 0, MapPinned],
            ["Badges", "Coming soon", Award],
            ["Cities helped", profile?.city ? 1 : 0, MapPinned],
          ].map(([label, value, Icon]) => (
            <div className="border border-line bg-surface p-5" key={String(label)}>
              <Icon className="text-brand" aria-hidden="true" />
              <p className="mt-4 text-sm text-muted">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{String(value)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {["Recent contributions", "Places helped", "Badges"].map((title) => (
            <section className="border border-line bg-surface p-5" key={title}>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm text-muted">Placeholder for Phase 1.</p>
            </section>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
