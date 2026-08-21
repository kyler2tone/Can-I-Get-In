import { notFound } from "next/navigation";
import { Award, CalendarDays, MapPinned } from "lucide-react";
import { BadgeEmblem } from "@/components/badges/badge-emblem";
import { PageShell } from "@/components/page-shell";
import { getContributorImpact } from "@/lib/contributor-impact";
import { getSupabaseServerClient } from "@/lib/supabase";
import { sampleProfiles } from "@/lib/sample-data";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `Contributor ${username}` };
}

export default async function ContributorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("public_profiles")
    .select("id, username, display_name, avatar_url, bio, city, state, points, contribution_count, created_at")
    .eq("username", username)
    .maybeSingle();

  const profile =
    data ??
    sampleProfiles.find((sample) => sample.username === username) ??
    (username === "rapidcity-helper" ? sampleProfiles[0] : null);

  if (!profile) notFound();

  const displayName = "display_name" in profile ? profile.display_name : profile.displayName;
  const createdAt = "created_at" in profile ? profile.created_at : profile.joinedAt;
  const count =
    "contribution_count" in profile ? profile.contribution_count : profile.contributionCount;
  const impact = "id" in profile && typeof profile.id === "string" ? await getContributorImpact(profile.id) : null;
  const earnedBadges = impact?.earnedBadges ?? [];

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="border border-line bg-surface p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Contributor
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{displayName}</h1>
          <p className="mt-1 text-muted">@{profile.username}</p>
          <p className="mt-4 max-w-2xl whitespace-pre-line leading-7 text-muted">
            {profile.bio || "This Contributor has not added a bio yet."}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="border border-line bg-white p-4">
              <MapPinned className="text-brand" aria-hidden="true" />
              <p className="mt-2 text-sm text-muted">Places helped</p>
              <p className="text-2xl font-semibold">{count}</p>
            </div>
            <div className="border border-line bg-white p-4">
              <Award className="text-brand" aria-hidden="true" />
              <p className="mt-2 text-sm text-muted">Badges</p>
              <p className="text-2xl font-semibold">{earnedBadges.length}</p>
            </div>
            <div className="border border-line bg-white p-4">
              <CalendarDays className="text-brand" aria-hidden="true" />
              <p className="mt-2 text-sm text-muted">Joined</p>
              <p className="text-lg font-semibold">{createdAt?.slice(0, 10)}</p>
            </div>
          </div>
          {earnedBadges.length ? (
            <section className="mt-6 border border-line bg-white p-4" aria-labelledby="earned-badges">
              <h2 id="earned-badges" className="font-semibold">Earned Badges</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {earnedBadges.map((badge) => (
                  <BadgeEmblem badge={badge} key={badge.slug} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
