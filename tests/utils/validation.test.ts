import { describe, expect, it } from "vitest";
import {
  passwordStrengthLabel,
  reservedUsernames,
  signupSchema,
  usernameSchema,
} from "@/lib/validation";

describe("username validation", () => {
  it("accepts and normalizes safe usernames", () => {
    expect(usernameSchema.safeParse("rapidcity_2026").success).toBe(true);
    expect(usernameSchema.parse("Rapid-City")).toBe("rapid-city");
    expect(usernameSchema.parse(" Rapid City ")).toBe("rapid-city");
  });

  it("rejects short, unsafe, and reserved usernames", () => {
    expect(usernameSchema.safeParse("RC").success).toBe(false);
    expect(usernameSchema.safeParse("rapid.city").success).toBe(false);
    expect(usernameSchema.safeParse("admin").success).toBe(false);
    expect(reservedUsernames.has("canigetin")).toBe(true);
  });
});

describe("signup validation", () => {
  it("requires matching password confirmation", () => {
    expect(
      signupSchema.safeParse({
        email: "person@example.com",
        password: "long-enough",
        confirmPassword: "long-enough",
      }).success,
    ).toBe(true);
    expect(
      signupSchema.safeParse({
        email: "person@example.com",
        password: "long-enough",
        confirmPassword: "different-password",
      }).success,
    ).toBe(false);
  });
});

describe("password strength labels", () => {
  it("labels passwords by minimum project rules", () => {
    expect(passwordStrengthLabel("short")).toBe("too_short");
    expect(passwordStrengthLabel("longenough")).toBe("usable");
    expect(passwordStrengthLabel("long-enough-123")).toBe("strong");
  });
});
