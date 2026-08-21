import Link from "next/link";
import { Award, Camera, MapPinned, Pencil, Trophy, type LucideIcon } from "lucide-react";
import { BadgeEmblem } from "@/components/badges/badge-emblem";
import { PageShell } from "@/components/page-shell";
import { requireUser, getCurrentProfile } from "@/lib/auth";
import { getContributorImpact } from "@/lib/contributor-impact";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const impact = await getContributorImpact(user.id);

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
          {([
            ["Points", impact.points, Trophy],
            ["Contributions", impact.contributionCount, Camera],
            ["Badges", impact.earnedBadges.length, Award],
            ["Cities Helped", impact.citiesHelped, MapPinned],
          ] satisfies Array<[string, number, LucideIcon]>).map(([label, value, Icon]) => (
            <div className="border border-line bg-surface p-5" key={String(label)}>
              <Icon className="text-brand" aria-hidden="true" />
              <p className="mt-4 text-sm text-muted">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{String(value)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Recent Contributions</h2>
            {impact.recentContributions.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {impact.recentContributions.map((item) => (
                  <li key={item.id}>
                    <Link className="font-semibold text-brand-strong underline" href={`/places/${item.placeSlug}`}>
                      {item.placeName}
                    </Link>
                    <p className="text-muted">{item.description}</p>
                    <p className="text-xs text-muted">{formatDate(item.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Approved contributions will appear here.</p>
            )}
          </section>
          <section className="border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Places Helped</h2>
            {impact.helpedPlaces.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {impact.helpedPlaces.map((place) => (
                  <li key={place.id}>
                    <Link className="font-semibold text-brand-strong underline" href={`/places/${place.slug}`}>
                      {place.name}
                    </Link>
                    <p className="text-muted">
                      {place.city}, {place.state} · {place.contributionCount}{" "}
                      {place.contributionCount === 1 ? "contribution" : "contributions"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Places you help will appear here.</p>
            )}
          </section>
          <section className="border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Badges</h2>
            <div className="mt-3 grid gap-3">
              {impact.badges.map((badge) => (
                <BadgeEmblem badge={badge} key={badge.slug} showProgress />
              ))}
            </div>
          </section>
        </div>
      </section>
    </PageShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}
