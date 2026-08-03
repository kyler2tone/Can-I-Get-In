import { DoorOpen, LogOut, MapPinned, UserRound } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();

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
            <>
              <Link
                className="hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-white sm:inline-flex"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <form action={logoutAction}>
                <Button variant="ghost" title="Log out">
                  <LogOut size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </form>
            </>
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
