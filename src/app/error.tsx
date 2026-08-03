"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md border border-line bg-surface p-6">
        <h1 className="text-2xl font-semibold">Something needs another look.</h1>
        <p className="mt-3 text-sm text-muted">{error.message}</p>
        <div className="mt-5 flex gap-3">
          <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={reset}>
            Try again
          </button>
          <Link className="rounded-md border border-line px-4 py-2 text-sm font-semibold" href="/">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
