import { SignupForm } from "@/components/auth/signup-form";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <PageShell>
      <SignupForm />
    </PageShell>
  );
}
