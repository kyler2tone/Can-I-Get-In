import { z } from "zod";
import {
  accessibilityFactors,
  accessibilityStatusValues,
  type AccessibilityFactorKey,
} from "@/lib/accessibility-factors";

export const contributorNotesMaxLength = 2000;

export const contributorObservationValueSchema = z.enum(accessibilityStatusValues);

export const contributorObservationSchema = z.object(
  Object.fromEntries(
    accessibilityFactors.map((factor) => [factor.key, contributorObservationValueSchema.optional()]),
  ) as unknown as Record<AccessibilityFactorKey, z.ZodOptional<typeof contributorObservationValueSchema>>,
);

export function contributorObservationLabel(value: string) {
  const labels: Record<string, string> = {
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    automatic: "Automatic door",
    door_not_automatic: "Door present, not automatic",
    no_door_on_site: "No door on site",
    restroom_available: "Accessible restroom available",
    restroom_present_not_accessible: "Restroom present but not accessible",
    no_restroom_on_site: "No restroom on site",
    lower_accessible_height: "Lower / accessible height",
    standing_height: "Standing height / tall",
    not_applicable: "No counter or front desk",
    not_needed: "Elevator not needed",
    not_sure: "Not sure",
    did_not_need: "Did not need to use this",
    could_not_tell: "Could not tell",
  };

  return labels[value] ?? value;
}
