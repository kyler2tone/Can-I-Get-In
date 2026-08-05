import { describe, expect, it } from "vitest";
import { formatContributorExportText, type ContributorExportPayload } from "@/lib/data-export";

describe("contributor TXT export", () => {
  it("formats a readable contributor export", () => {
    const payload: ContributorExportPayload = {
      exportedAt: "2026-08-05T12:00:00.000Z",
      account: { id: "user-1", email: "person@example.com" },
      profile: {
        display_name: "Rapid Helper",
        username: "rapid-helper",
        bio: "Checking entrances.",
        city: "Rapid City",
        state: "SD",
        created_at: "2026-08-04T12:00:00.000Z",
        points: 15,
        contribution_count: 2,
      },
      placesHelped: [{ id: "place-1" }],
      uploadedPhotoMetadata: [{ id: "photo-1" }, { id: "photo-2" }],
      reports: [],
      verifications: [{ id: "verification-1" }],
      contributions: [{ id: "contribution-1" }],
      badges: [],
      excluded: ["raw uploaded image files"],
    };

    const text = formatContributorExportText(payload);

    expect(text).toContain("Can I Get In?\nContributor Data Export");
    expect(text).toContain("Display Name: Rapid Helper");
    expect(text).toContain("Username: rapid-helper");
    expect(text).toContain("Email: person@example.com");
    expect(text).toContain("Photos contributed: 2");
    expect(text).toContain("- raw uploaded image files");
  });
});

