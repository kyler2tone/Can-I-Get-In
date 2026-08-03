import { loginAction } from "@/lib/actions";
import { AuthForm, AuthLink } from "@/components/auth/auth-form";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <PageShell>
      <AuthForm
        title="Log in"
        description="Access your Contributor dashboard."
        submitLabel="Log in"
        action={loginAction}
        footer={
          <>
            New here? <AuthLink href="/auth/signup">Create an account</AuthLink>. Forgot your
            password? <AuthLink href="/auth/forgot-password">Reset it</AuthLink>.
          </>
        }
      />
    </PageShell>
  );
}
