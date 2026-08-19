"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { DoorOpen, LogOut, MapPinned, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";

type HeaderProfile = {
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  username: string | null;
  canAccessStudio: boolean;
} | null;

const primaryLinks = [
  { label: "Explore", href: "/#explore-cities" },
  { label: "Map", href: "/map" },
  { label: "Contribute", href: "/contribute" },
  { label: "For Businesses", href: "/contribute" },
  { label: "About", href: "/about" },
];

export function SiteHeaderClient({
  profile,
  sticky,
}: {
  profile: HeaderProfile;
  sticky: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (mobileMenuRef.current?.contains(target)) return;
      if (mobileButtonRef.current?.contains(target)) return;
      setMobileOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        window.setTimeout(() => mobileButtonRef.current?.focus(), 0);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header
      className={`${sticky ? "sticky top-0" : "relative"} z-30 border-b border-line bg-white/90 backdrop-blur-xl`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link className="flex min-w-0 items-center gap-2 font-black text-foreground" href="/">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-sm">
            <DoorOpen size={20} aria-hidden="true" />
          </span>
          <span className="truncate">Can I Get In?</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <PrimaryLinks />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            aria-controls="mobile-site-menu"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close site menu" : "Open site menu"}
            className="grid size-10 place-items-center rounded-full text-brand-strong transition hover:bg-sky-soft focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand active:translate-y-px md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            ref={mobileButtonRef}
            type="button"
          >
            {mobileOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
          <AccountMenu profile={profile} />
        </div>
      </nav>

      {mobileOpen ? (
        <div
          className="border-t border-line bg-white px-4 py-3 shadow-lg md:hidden"
          id="mobile-site-menu"
          ref={mobileMenuRef}
        >
          <div className="grid gap-1">
            <PrimaryLinks onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="mt-3 border-t border-line pt-3">
            <MobileAccountLinks profile={profile} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </header>
  );
}

function PrimaryLinks({ onNavigate }: { onNavigate?: () => void }) {
  return primaryLinks.map((link) => (
    <Link
      className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold text-foreground/78 transition hover:bg-sky-soft hover:text-brand-strong focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
      href={link.href}
      key={link.label}
      onClick={onNavigate}
    >
      {link.label}
    </Link>
  ));
}

function AccountMenu({ profile }: { profile: HeaderProfile }) {
  if (!profile) {
    return (
      <>
        <Link
          className="hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold text-foreground/78 transition hover:bg-sky-soft hover:text-brand-strong sm:inline-flex"
          href="/auth/login"
        >
          <UserRound size={16} aria-hidden="true" />
          Sign in
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong"
          href="/auth/signup"
        >
          <MapPinned size={16} aria-hidden="true" className="inline sm:hidden" />
          <span className="hidden sm:inline">Join</span>
        </Link>
      </>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full px-2 py-1 hover:bg-sky-soft focus:outline focus:outline-2 focus:outline-brand">
        <Avatar profile={profile} />
        <span className="sr-only">Open account menu</span>
      </summary>
      <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-white p-2 shadow-lg">
        <AccountLinks profile={profile} />
      </div>
    </details>
  );
}

function MobileAccountLinks({
  profile,
  onNavigate,
}: {
  profile: HeaderProfile;
  onNavigate: () => void;
}) {
  if (!profile) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-bold"
          href="/auth/login"
          onClick={onNavigate}
        >
          Sign in
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand bg-brand px-3 py-2 text-sm font-bold text-white"
          href="/auth/signup"
          onClick={onNavigate}
        >
          Join
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <div className="mb-2 flex items-center gap-2 px-3 text-sm font-semibold">
        <Avatar profile={profile} />
        <span className="min-w-0 truncate">{profile.displayName}</span>
      </div>
      <AccountLinks profile={profile} onNavigate={onNavigate} />
    </div>
  );
}

function AccountLinks({
  profile,
  onNavigate,
}: {
  profile: NonNullable<HeaderProfile>;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface" href="/dashboard" onClick={onNavigate}>
        My Dashboard
      </Link>
      {profile.username ? (
        <Link
          className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface"
          href={`/contributors/${profile.username}`}
          onClick={onNavigate}
        >
          Public Profile
        </Link>
      ) : null}
      <Link className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface" href="/settings/profile" onClick={onNavigate}>
        Profile Settings
      </Link>
      <Link className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface" href="/settings/account" onClick={onNavigate}>
        Account Settings
      </Link>
      {profile.canAccessStudio ? (
        <>
          <div className="my-2 border-t border-line" />
          <Link className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-surface" href="/studio" onClick={onNavigate}>
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
    </>
  );
}

function Avatar({ profile }: { profile: NonNullable<HeaderProfile> }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-white text-sm font-bold text-brand-strong">
      {profile.avatarUrl ? (
        <img alt="" className="size-full object-cover" src={profile.avatarUrl} />
      ) : (
        profile.initials
      )}
    </span>
  );
}
