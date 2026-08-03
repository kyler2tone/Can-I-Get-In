import { signupAction } from "@/lib/actions";
import { AuthForm, AuthLink } from "@/components/auth/auth-form";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <PageShell>
      <AuthForm
        title="Create a Contributor account"
        description="Register with email and password. You will verify your email before contributing."
        submitLabel="Sign up"
        action={signupAction}
        footer={
          <>
            Already have an account? <AuthLink href="/auth/login">Log in</AuthLink>.
          </>
        }
      />
    </PageShell>
  );
}
