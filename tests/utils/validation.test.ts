import { describe, expect, it } from "vitest";
import { passwordStrengthLabel, usernameSchema } from "@/lib/validation";

describe("username validation", () => {
  it("accepts lowercase usernames with numbers and underscores", () => {
    expect(usernameSchema.safeParse("rapidcity_2026").success).toBe(true);
  });

  it("rejects uppercase or short usernames", () => {
    expect(usernameSchema.safeParse("RC").success).toBe(false);
    expect(usernameSchema.safeParse("RapidCity").success).toBe(false);
  });
});

describe("password strength labels", () => {
  it("labels passwords by minimum project rules", () => {
    expect(passwordStrengthLabel("short")).toBe("too_short");
    expect(passwordStrengthLabel("longenough")).toBe("usable");
    expect(passwordStrengthLabel("long-enough-123")).toBe("strong");
  });
});
