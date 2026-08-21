import { Camera, MapPinned, PlusCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getStudioActivityLog, type StudioActivityRange } from "@/lib/studio";

export const metadata = {
  title: "Activity Log",
};

const filters: Array<{ label: string; value: StudioActivityRange }> = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

export default async function StudioActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange = "week" } = await searchParams;
  const range = isActivityRange(rawRange) ? rawRange : "week";
  const items = await getStudioActivityLog(range);
  const counts = {
    city: items.filter((item) => item.kind === "city").length,
    place: items.filter((item) => item.kind === "place").length,
    photo: items.filter((item) => item.kind === "photo").length,
  };

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Activity Log</p>
      <h1 className="mt-2 text-3xl font-semibold">New Community Activity</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted">
        Track new cities, places, and photos added to CIGI during the selected time window.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            className={`rounded-md border px-4 py-2 text-sm font-semibold ${
              filter.value === range
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-brand-strong"
            }`}
            href={`/studio/activity?range=${filter.value}`}
            key={filter.value}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={MapPinned} label="New Cities" value={counts.city} />
        <SummaryCard icon={PlusCircle} label="New Places" value={counts.place} />
        <SummaryCard icon={Camera} label="New Photos" value={counts.photo} />
      </div>

      <section className="mt-6 border border-line bg-surface p-5" aria-labelledby="activity-items">
        <h2 id="activity-items" className="text-xl font-semibold">Activity</h2>
        {items.length ? (
          <ol className="mt-4 space-y-3">
            {items.map((item) => {
              const Icon = item.kind === "city" ? MapPinned : item.kind === "place" ? PlusCircle : Camera;
              const content = (
                <span className="flex min-w-0 items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-soft text-brand-strong">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.title}</span>
                    <span className="block text-sm text-muted">{item.description}</span>
                    <span className="block text-xs text-muted">{formatDate(item.createdAt)}</span>
                  </span>
                </span>
              );

              return (
                <li className="rounded-md border border-line bg-white p-3" key={item.id}>
                  {item.href ? (
                    <Link className="block focus:outline focus:outline-2 focus:outline-brand" href={item.href}>
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted">No new activity in this time window.</p>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="border border-line bg-surface p-5">
      <Icon className="text-brand" aria-hidden="true" />
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function isActivityRange(value: string): value is StudioActivityRange {
  return value === "day" || value === "week" || value === "month";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
