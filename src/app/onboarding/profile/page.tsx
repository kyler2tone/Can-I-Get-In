import { PageShell } from "@/components/page-shell";
import { ProfileCompletionForm } from "@/components/account/profile-completion-form";
import { getCurrentProfile, requireUser } from "@/lib/auth";

export const metadata = {
  title: "Complete Profile",
};

export default async function ProfileOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ displayName?: string; error?: string; next?: string; username?: string }>;
}) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const { displayName, error, next, username } = await searchParams;

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Complete your Contributor profile</h1>
        <p className="mt-3 leading-7 text-muted">
          Choose a public display name and username before contributing photos. Your login
          email stays private and is not used in public profile URLs.
        </p>
        <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-muted">
          Signed in as {user.email}
        </p>
        <div className="mt-6">
          <ProfileCompletionForm
            displayName={displayName ?? profile?.display_name ?? ""}
            error={error}
            next={next && next.startsWith("/") ? next : "/dashboard"}
            username={username}
          />
        </div>
      </section>
    </PageShell>
  );
}
