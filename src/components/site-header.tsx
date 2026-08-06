/* eslint-disable @next/next/no-img-element */
import { DoorOpen, LogOut, MapPinned, UserRound } from "lucide-react";
import Link from "next/link";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { canAccessStudio } from "@/lib/roles";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  const displayName = profile?.display_name ?? user?.email ?? "Contributor";
  const initials = initialsFor(displayName);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link className="flex items-center gap-2 font-semibold text-foreground" href="/">
          <span className="grid size-9 place-items-center rounded-md bg-brand text-white">
            <DoorOpen size={20} aria-hidden="true" />
          </span>
          <span>Can I Get In?</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white" href="/map">
            Map
          </Link>
          <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white" href="/contribute">
            Contribute
          </Link>
          {user ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1 hover:bg-white focus:outline focus:outline-2 focus:outline-brand">
                <span className="grid size-10 place-items-center overflow-hidden rounded-full border border-line bg-white text-sm font-semibold text-brand-strong">
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
              <div className="absolute right-0 mt-2 w-56 border border-line bg-white p-2 shadow-lg">
                <Link className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-surface" href="/dashboard">
                  My Dashboard
                </Link>
                {profile?.username ? (
                  <Link
                    className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-surface"
                    href={`/contributors/${profile.username}`}
                  >
                    Public Profile
                  </Link>
                ) : null}
                <Link
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-surface"
                  href="/settings/profile"
                >
                  Profile Settings
                </Link>
                <Link
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-surface"
                  href="/settings/account"
                >
                  Account Settings
                </Link>
                {canAccessStudio(profile?.role) ? (
                  <>
                    <div className="my-2 border-t border-line" />
                    <Link
                      className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-surface"
                      href="/studio"
                    >
                      Studio
                    </Link>
                  </>
                ) : null}
                <div className="my-2 border-t border-line" />
                <form action="/auth/logout" method="post">
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-brand-strong hover:bg-surface"
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
                className="hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-white sm:inline-flex"
                href="/auth/login"
              >
                <UserRound size={16} aria-hidden="true" />
                Sign in
              </Link>
              <Link
                className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
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
