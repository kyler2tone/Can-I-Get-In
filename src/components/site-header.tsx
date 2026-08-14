/* eslint-disable @next/next/no-img-element */
import { DoorOpen, LogOut, MapPinned, UserRound } from "lucide-react";
import Link from "next/link";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { canAccessStudio } from "@/lib/roles";

const primaryLinks = [
  { label: "Explore", href: "/#explore-cities" },
  { label: "Map", href: "/map" },
  { label: "Contribute", href: "/contribute" },
  { label: "For Businesses", href: "/contribute" },
  { label: "About", href: "/#about" },
];

export async function SiteHeader({ sticky = true }: { sticky?: boolean }) {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  const displayName = profile?.display_name ?? user?.email ?? "Contributor";
  const initials = initialsFor(displayName);

  return (
    <header
      className={`${sticky ? "sticky top-0" : "relative"} z-30 border-b border-line bg-white/90 backdrop-blur-xl`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link className="flex min-w-0 items-center gap-2 font-black text-foreground" href="/">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-sm">
            <DoorOpen size={20} aria-hidden="true" />
          </span>
          <span className="truncate">Can I Get In?</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {primaryLinks.map((link) => (
            <Link
              className="rounded-full px-3 py-2 text-sm font-bold text-foreground/78 transition hover:bg-sky-soft hover:text-brand-strong"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full px-2 py-1 hover:bg-sky-soft focus:outline focus:outline-2 focus:outline-brand">
                <span className="grid size-10 place-items-center overflow-hidden rounded-full border border-line bg-white text-sm font-bold text-brand-strong">
                  {profile?.avatar_url ? (
                    <img
                      alt=""
                      className="size-full object-cover"
                      src={profile.avatar_url}
                    />
                  ) : (
                    initials
                  )}
                </span>
                <span className="sr-only">Open account menu</span>
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-white p-2 shadow-lg">
                <Link className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface" href="/dashboard">
                  My Dashboard
                </Link>
                {profile?.username ? (
                  <Link
                    className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface"
                    href={`/contributors/${profile.username}`}
                  >
                    Public Profile
                  </Link>
                ) : null}
                <Link
                  className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface"
                  href="/settings/profile"
                >
                  Profile Settings
                </Link>
                <Link
                  className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface"
                  href="/settings/account"
                >
                  Account Settings
                </Link>
                {canAccessStudio(profile?.role) ? (
                  <>
                    <div className="my-2 border-t border-line" />
                    <Link
                      className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface"
                      href="/studio"
                    >
                      Studio
                    </Link>
                  </>
                ) : null}
                <div className="my-2 border-t border-line" />
                <form action="/auth/logout" method="post">
                  <button
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-brand-strong hover:bg-surface"
                    type="submit"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Sign Out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <>
              <Link
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-foreground/78 transition hover:bg-sky-soft hover:text-brand-strong sm:inline-flex"
                href="/auth/login"
              >
                <UserRound size={16} aria-hidden="true" />
                Sign in
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong"
                href="/auth/signup"
              >
                <MapPinned size={16} aria-hidden="true" className="inline sm:hidden" />
                <span className="hidden sm:inline">Join</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function initialsFor(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "CI";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
