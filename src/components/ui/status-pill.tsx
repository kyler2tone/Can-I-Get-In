import { formatEntryOutcome } from "@/lib/sample-data";
import type { EntryOutcome } from "@/lib/types";

const classes: Record<EntryOutcome, string> = {
  likely_independent: "bg-emerald-100 text-emerald-900",
  may_require_assistance: "bg-amber-100 text-amber-950",
  visible_barrier: "bg-rose-100 text-rose-950",
  insufficient_information: "bg-slate-100 text-slate-800",
};

export function StatusPill({ outcome }: { outcome: EntryOutcome }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${classes[outcome]}`}>
      {formatEntryOutcome(outcome)}
    </span>
  );
}
