import type { ReactNode } from "react";
import { Disclaimer } from "@/components/ui/disclaimer";
import { SiteHeader } from "@/components/site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Disclaimer />
      <footer className="bg-brand-strong px-4 py-8 text-sm text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>Open source. Built for the OpenAI Build for Good Challenge 2026.</p>
          <p>Know before you go.</p>
        </div>
      </footer>
    </>
  );
}
