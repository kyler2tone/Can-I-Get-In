import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Map", href: "/map" },
      { label: "Contribute", href: "/contribute" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/auth/login" },
      { label: "Join", href: "/auth/signup" },
      { label: "Account settings", href: "/settings/account" },
    ],
  },
  {
    title: "CIGI",
    links: [
      { label: "About", href: "/about" },
    ],
  },
];

const footerPrinciples = [
  ["Community powered", "Real info from real people like you."],
  ["Fresh context", "Photos, routes, doors, parking, and more."],
  ["Privacy first", "Your privacy matters. Always."],
  ["Built to travel", "Ready for more cities as coverage grows."],
];

export function PageShell({
  children,
  stickyHeader = true,
}: {
  children: ReactNode;
  stickyHeader?: boolean;
}) {
  return (
    <>
      <SiteHeader sticky={stickyHeader} />
      <main className="flex-1">{children}</main>
      <footer className="relative overflow-hidden bg-brand-strong px-4 py-12 text-sm text-white sm:px-6 lg:px-8" id="about">
        <Image
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-16 opacity-[0.07] sm:-bottom-32 sm:-right-24"
          height={520}
          src="/brand/CanIGetInLogoMark.png"
          width={520}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h2 className="text-2xl font-black">Can I Get In?</h2>
            <p className="mt-3 max-w-xl text-white/78">
              Community-contributed accessibility observations to help visitors know before they go.
              Information may be incomplete, approximate, or outdated and is not a formal
              accessibility or ADA inspection.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {footerPrinciples.map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 text-white/72">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="font-black">{group.title}</h3>
                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link className="whitespace-nowrap text-white/76 transition hover:text-white" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/18 pt-6 text-white/72 sm:flex-row sm:items-center sm:justify-between">
          <p>Open source. Built for the OpenAI Build for Good Challenge 2026.</p>
          <p>Know before you go.</p>
        </div>
      </footer>
    </>
  );
}
