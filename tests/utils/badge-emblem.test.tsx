import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BadgeEmblem } from "@/components/badges/badge-emblem";
import type { ContributorBadge } from "@/lib/contributor-impact";

describe("badge emblem", () => {
  it("renders earned badges as named emblems", () => {
    render(<BadgeEmblem badge={{ ...badge, earned: true }} />);

    expect(screen.getByText("First Contribution")).toBeInTheDocument();
    expect(screen.getByText("Added the first accessibility detail.")).toBeInTheDocument();
  });

  it("renders locked badges with progress feedback", () => {
    render(<BadgeEmblem badge={{ ...badge, earned: false, progress: 1, target: 3 }} showProgress />);

    expect(screen.getByText("2 more contributions to unlock")).toBeInTheDocument();
  });
});

const badge: ContributorBadge = {
  slug: "first-contribution",
  name: "First Contribution",
  description: "Added the first accessibility detail.",
  earned: true,
  progress: 3,
  target: 3,
  progressLabel: "2 more contributions to unlock",
};
