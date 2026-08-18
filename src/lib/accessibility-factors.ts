import { CheckCircle2, CircleHelp, XCircle, type LucideIcon } from "lucide-react";

export const accessibilityFactors = [
  { key: "step_free_entrance", label: "Step-free entrance" },
  { key: "automatic_door", label: "Automatic door" },
  { key: "ramp_present", label: "Ramp present" },
  { key: "accessible_parking", label: "Accessible parking" },
  { key: "accessible_restroom", label: "Accessible restroom" },
  { key: "interior_route", label: "Interior route" },
  { key: "seating_access", label: "Seating access" },
  { key: "counter_access", label: "Counter access" },
] as const;

export type AccessibilityFactorKey = (typeof accessibilityFactors)[number]["key"];
export type AccessibilityStatus = "yes" | "no" | "unknown";

export type AccessibilityFactorObservation = {
  factor: AccessibilityFactorKey;
  label: string;
  status: AccessibilityStatus;
  confidence: number;
  evidenceSummary: string;
};

export const accessibilityStatusMeta: Record<
  AccessibilityStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  yes: {
    label: "Documented",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  no: {
    label: "Not documented",
    icon: XCircle,
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
  unknown: {
    label: "Unknown",
    icon: CircleHelp,
    className: "border-line bg-white text-muted",
  },
};

export function isAccessibilityFactor(value: string): value is AccessibilityFactorKey {
  return accessibilityFactors.some((factor) => factor.key === value);
}

export function getAccessibilityFactorLabel(value: string) {
  return accessibilityFactors.find((factor) => factor.key === value)?.label ?? value.replaceAll("_", " ");
}

export function emptyAccessibilityObservations(): AccessibilityFactorObservation[] {
  return accessibilityFactors.map((factor) => ({
    factor: factor.key,
    label: factor.label,
    status: "unknown",
    confidence: 1,
    evidenceSummary: "No approved evidence has been analyzed for this factor yet.",
  }));
}
