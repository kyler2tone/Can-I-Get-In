import { PageShell } from "@/components/page-shell";
import { ProfileForm } from "@/components/auth/profile-form";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile, requireUser } from "@/lib/auth";

export const metadata = {
  title: "Profile Settings",
};

export default async function ProfileSettingsPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-semibold">Profile settings</h1>
        <p className="mt-2 text-muted">
          Edit the public Contributor profile fields you control.
        </p>
        <div className="mt-4">
          <ButtonLink href="/settings/account" variant="secondary">
            Open account settings
          </ButtonLink>
        </div>
        <div className="mt-6">
          <ProfileForm profile={profile} />
        </div>
      </section>
    </PageShell>
  );
}
