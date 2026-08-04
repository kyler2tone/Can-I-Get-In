import { LoginForm } from "@/components/auth/login-form";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <PageShell>
      <LoginForm />
    </PageShell>
  );
}
