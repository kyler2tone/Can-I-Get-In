import { describe, expect, it } from "vitest";
import { canContributePhotos } from "@/lib/account";

describe("profile completion enforcement", () => {
  it("allows photo contribution only after profile completion", () => {
    expect(canContributePhotos({ profile_completed: true })).toBe(true);
    expect(canContributePhotos({ profile_completed: false })).toBe(false);
    expect(canContributePhotos(null)).toBe(false);
  });
});
