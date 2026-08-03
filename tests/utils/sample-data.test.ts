import { describe, expect, it } from "vitest";
import { formatEntryOutcome, getPlaceBySlug, samplePlaces } from "@/lib/sample-data";

describe("sample place data", () => {
  it("contains Rapid City phase 1 places with slugs", () => {
    expect(samplePlaces.length).toBeGreaterThanOrEqual(3);
    expect(getPlaceBySlug("main-street-square")?.name).toBe("Main Street Square");
  });

  it("formats entry outcomes without binary accessibility labels", () => {
    expect(formatEntryOutcome("likely_independent")).toBe("Likely independent");
    expect(formatEntryOutcome("insufficient_information")).toBe("Insufficient information");
  });
});
