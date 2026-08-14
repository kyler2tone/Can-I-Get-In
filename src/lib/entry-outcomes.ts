import type { EntryOutcome } from "@/lib/types";

export function formatEntryOutcome(outcome: EntryOutcome) {
  const labels: Record<EntryOutcome, string> = {
    likely_independent: "Likely independent",
    may_require_assistance: "May require assistance",
    visible_barrier: "Visible barrier",
    insufficient_information: "Insufficient information",
  };

  return labels[outcome];
}
