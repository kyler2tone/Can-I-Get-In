import { forgotPasswordAction } from "@/lib/actions";
import { AuthForm, AuthLink } from "@/components/auth/auth-form";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <PageShell>
      <AuthForm
        title="Forgot password"
        description="Enter your email and we will send a reset link if an account exists."
        submitLabel="Send reset link"
        action={forgotPasswordAction}
        showPassword={false}
        footer={
          <>
            Remembered it? <AuthLink href="/auth/login">Return to login</AuthLink>.
          </>
        }
      />
    </PageShell>
  );
}
