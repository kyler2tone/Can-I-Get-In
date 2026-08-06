import { cookies } from "next/headers";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PageShell } from "@/components/page-shell";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  passwordRecoveryIntentCookie,
  passwordRecoveryIntentValue,
} from "@/lib/password-recovery";

export const metadata = {
  title: "Reset Password",
};

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const hasRecoveryIntent =
    cookieStore.get(passwordRecoveryIntentCookie)?.value === passwordRecoveryIntentValue;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canResetPassword = Boolean(hasRecoveryIntent && user);

  return (
    <PageShell>
      <section className="px-4 py-12">
        <ResetPasswordForm
          canResetPassword={canResetPassword}
          initialError={
            canResetPassword
              ? undefined
              : "This password reset link is invalid or expired. Request a new reset email."
          }
        />
      </section>
    </PageShell>
  );
}
