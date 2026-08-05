import { describe, expect, it } from "vitest";
import { canStartAccountDeletion } from "@/lib/account-deletion";

describe("account deletion duplicate guard", () => {
  it("allows the first deletion request only when nothing is pending", () => {
    expect(canStartAccountDeletion({ pending: false, submitted: false })).toBe(true);
    expect(canStartAccountDeletion({ pending: true, submitted: false })).toBe(false);
    expect(canStartAccountDeletion({ pending: false, submitted: true })).toBe(false);
  });
});

