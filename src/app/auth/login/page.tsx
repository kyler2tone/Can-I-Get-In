import { LoginForm } from "@/components/auth/login-form";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Log In",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <PageShell>
      <LoginForm next={safeNext} />
    </PageShell>
  );
}
