import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md border border-line bg-surface p-6">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-muted">
          That accessibility record is not available in Phase 1.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
          href="/map"
        >
          Return to the map
        </Link>
      </div>
    </div>
  );
}
