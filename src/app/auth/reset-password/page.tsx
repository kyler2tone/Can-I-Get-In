import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <PageShell>
      <section className="px-4 py-12">
        <ResetPasswordForm />
      </section>
    </PageShell>
  );
}
