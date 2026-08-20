import { CheckCircle2, CircleHelp, Info, MinusCircle, XCircle, type LucideIcon } from "lucide-react";

export const accessibilityFactors = [
  { key: "step_free_entrance", label: "Step-free entrance" },
  { key: "automatic_door", label: "Automatic door" },
  { key: "ramp_present", label: "Ramp present" },
  { key: "accessible_parking", label: "Accessible parking" },
  { key: "curb_cut", label: "Curb cut" },
  { key: "accessible_restroom", label: "Accessible restroom" },
  { key: "interior_route", label: "Interior route" },
  { key: "seating_access", label: "Seating access" },
  { key: "counter_access", label: "Counter / Front Desk" },
  { key: "elevator", label: "Elevator" },
] as const;

export type AccessibilityFactorKey = (typeof accessibilityFactors)[number]["key"];
export const accessibilityStatusValues = [
  "yes",
  "no",
  "unknown",
  "automatic",
  "door_not_automatic",
  "no_door_on_site",
  "restroom_available",
  "restroom_present_not_accessible",
  "no_restroom_on_site",
  "lower_accessible_height",
  "standing_height",
  "not_applicable",
  "not_needed",
] as const;
export type AccessibilityStatus = (typeof accessibilityStatusValues)[number];
export type AccessibilityEvidenceSource =
  | "photo"
  | "contributor"
  | "mixed"
  | "conflicting"
  | "none";

export type AccessibilityFactorObservation = {
  factor: AccessibilityFactorKey;
  label: string;
  status: AccessibilityStatus;
  confidence: number;
  evidenceSummary: string;
  evidenceSource: AccessibilityEvidenceSource;
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
  automatic: {
    label: "Automatic door",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  door_not_automatic: {
    label: "Door present, not automatic",
    icon: XCircle,
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
  no_door_on_site: {
    label: "No door on site",
    icon: MinusCircle,
    className: "border-line bg-white text-muted",
  },
  restroom_available: {
    label: "Accessible restroom available",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  restroom_present_not_accessible: {
    label: "Restroom present but not accessible",
    icon: XCircle,
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
  no_restroom_on_site: {
    label: "No restroom on site",
    icon: MinusCircle,
    className: "border-line bg-white text-muted",
  },
  lower_accessible_height: {
    label: "Lower / accessible height",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  standing_height: {
    label: "Standing height / tall",
    icon: XCircle,
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
  not_applicable: {
    label: "No counter or front desk",
    icon: MinusCircle,
    className: "border-line bg-white text-muted",
  },
  not_needed: {
    label: "Not needed",
    icon: Info,
    className: "border-line bg-white text-muted",
  },
};

export const defaultAccessibilityOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
] satisfies Array<{ value: AccessibilityStatus; label: string }>;

export const accessibilityFactorOptions: Record<
  AccessibilityFactorKey,
  Array<{ value: AccessibilityStatus; label: string }>
> = {
  step_free_entrance: defaultAccessibilityOptions,
  ramp_present: defaultAccessibilityOptions,
  accessible_parking: defaultAccessibilityOptions,
  curb_cut: defaultAccessibilityOptions,
  interior_route: defaultAccessibilityOptions,
  seating_access: defaultAccessibilityOptions,
  automatic_door: [
    { value: "automatic", label: "Automatic door" },
    { value: "door_not_automatic", label: "Door present, not automatic" },
    { value: "no_door_on_site", label: "No door on site / Not applicable" },
    { value: "unknown", label: "Unknown" },
  ],
  accessible_restroom: [
    { value: "restroom_available", label: "Accessible restroom available" },
    { value: "restroom_present_not_accessible", label: "Restroom present but not accessible" },
    { value: "no_restroom_on_site", label: "No restroom on site" },
    { value: "unknown", label: "Unknown" },
  ],
  counter_access: [
    { value: "lower_accessible_height", label: "Lower / accessible height" },
    { value: "standing_height", label: "Standing height / tall" },
    { value: "not_applicable", label: "Not applicable / no counter or front desk" },
    { value: "unknown", label: "Unknown" },
  ],
  elevator: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "not_needed", label: "Not needed" },
    { value: "unknown", label: "Unknown" },
  ],
};

export function isAccessibilityFactor(value: string): value is AccessibilityFactorKey {
  return accessibilityFactors.some((factor) => factor.key === value);
}

export function getAccessibilityFactorLabel(value: string) {
  return accessibilityFactors.find((factor) => factor.key === value)?.label ?? value.replaceAll("_", " ");
}

export function getAccessibilityStatusLabel(value: string) {
  return accessibilityStatusMeta[value as AccessibilityStatus]?.label ?? value.replaceAll("_", " ");
}

export function emptyAccessibilityObservations(): AccessibilityFactorObservation[] {
  return accessibilityFactors.map((factor) => ({
    factor: factor.key,
    label: factor.label,
    status: "unknown",
    confidence: 1,
    evidenceSummary: "No approved evidence has been analyzed for this factor yet.",
    evidenceSource: "none",
  }));
}
