import { PageShell } from "@/components/page-shell";
import { ProfileForm } from "@/components/auth/profile-form";
import { ChangeUsernameForm } from "@/components/account/change-username-form";
import {
  ChangeEmailForm,
  DeleteAccountForm,
  ExportDataButton,
  PasswordUpdateForm,
} from "@/components/account/account-forms";
import { getCurrentProfile, requireUser } from "@/lib/auth";

export const metadata = {
  title: "Account Settings",
};

export default async function AccountSettingsPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold">Account settings</h1>
          <p className="mt-2 text-muted">Manage your public identity, login, privacy, and data.</p>
        </div>
        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Public Profile</h2>
          <div className="mt-4">
            <ProfileForm profile={profile} />
          </div>
          {profile?.username ? (
            <div className="mt-4">
              <ChangeUsernameForm currentUsername={profile.username} />
            </div>
          ) : null}
        </section>
        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Login Email</h2>
          <div className="mt-4">
            <ChangeEmailForm email={user.email ?? "Unknown email"} />
          </div>
        </section>
        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Password and Authentication</h2>
          <div className="mt-4">
            <PasswordUpdateForm />
          </div>
        </section>
        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Connected Sign-In Methods</h2>
          <p className="mt-3 text-sm text-muted">
            Email/password, magic links, and Google sign-in are supported when enabled in
            Supabase. Provider connection details are managed by Supabase Auth.
          </p>
        </section>
        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Privacy and Data</h2>
          <p className="mt-3 text-sm text-muted">
            Export includes your profile, contribution history, places helped, uploaded photo
            metadata, reports, verifications, badges, and points where present.
          </p>
          <div className="mt-4">
            <ExportDataButton />
          </div>
        </section>
        <section className="border border-rose-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-rose-950">Danger Zone</h2>
          <div className="mt-4">
            <DeleteAccountForm />
          </div>
        </section>
      </section>
    </PageShell>
  );
}
