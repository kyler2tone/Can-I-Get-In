export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-line bg-white/90 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="size-10 rounded-2xl bg-sky-soft" />
          <div className="h-4 w-36 rounded bg-sky-soft" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-4 w-28 rounded bg-sky-soft" />
        <div className="mt-3 h-8 w-64 rounded bg-white" />
        <div className="mt-3 h-4 w-full max-w-lg rounded bg-white" />
        <p className="sr-only" role="status">
          Loading page.
        </p>
      </main>
    </div>
  );
}
