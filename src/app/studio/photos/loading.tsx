export default function StudioPhotosLoading() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        Photo Moderation
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Pending photos</h1>
      <div className="mt-8 border border-line bg-surface p-6" role="status">
        Loading photos awaiting review...
      </div>
    </div>
  );
}
