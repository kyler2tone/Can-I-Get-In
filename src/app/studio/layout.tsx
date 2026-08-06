import type { ReactNode } from "react";
import { PageShell } from "@/components/page-shell";
import { StudioNav } from "@/components/studio/studio-nav";
import { requireStudioAccess } from "@/lib/roles";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  await requireStudioAccess();

  return (
    <PageShell>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <StudioNav />
        </aside>
        <div>{children}</div>
      </section>
    </PageShell>
  );
}
