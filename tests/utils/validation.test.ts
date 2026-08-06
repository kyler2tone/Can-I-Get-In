import { describe, expect, it } from "vitest";
import {
  passwordStrengthLabel,
  passwordWithConfirmationSchema,
  reservedUsernames,
  signupSchema,
  usernameSchema,
} from "@/lib/validation";
import { validatePasswordPolicy } from "@/lib/password-policy";

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
        password: "StrongerPass12",
        confirmPassword: "StrongerPass12",
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

describe("password policy", () => {
  it("rejects passwords that are too short", () => {
    expect(validatePasswordPolicy("Aa1!short").valid).toBe(false);
    expect(passwordWithConfirmationSchema.safeParse({
      password: "Aa1!short",
      confirmPassword: "Aa1!short",
    }).success).toBe(false);
  });

  it("rejects passwords missing uppercase letters", () => {
    expect(validatePasswordPolicy("strongerpass1!").errors).toContain(
      "At least one uppercase letter",
    );
  });

  it("rejects passwords missing lowercase letters", () => {
    expect(validatePasswordPolicy("STRONGERPASS1!").errors).toContain(
      "At least one lowercase letter",
    );
  });

  it("rejects passwords missing numbers", () => {
    expect(validatePasswordPolicy("StrongerPass!!").errors).toContain("At least one number");
  });

  it("rejects mismatched confirmation values", () => {
    expect(validatePasswordPolicy("StrongerPass12", "DifferentPass12").errors).toContain(
      "Passwords do not match.",
    );
    expect(passwordWithConfirmationSchema.safeParse({
      password: "StrongerPass12",
      confirmPassword: "DifferentPass12",
    }).success).toBe(false);
  });

  it("accepts valid passwords consistently", () => {
    expect(validatePasswordPolicy("StrongerPass12", "StrongerPass12").valid).toBe(true);
    expect(passwordWithConfirmationSchema.safeParse({
      password: "StrongerPass12",
      confirmPassword: "StrongerPass12",
    }).success).toBe(true);
    expect(signupSchema.safeParse({
      email: "person@example.com",
      password: "StrongerPass12",
      confirmPassword: "StrongerPass12",
    }).success).toBe(true);
  });

  it("labels passwords by the shared project policy", () => {
    expect(passwordStrengthLabel("short")).toBe("too_short");
    expect(passwordStrengthLabel("longenough")).toBe("usable");
    expect(passwordStrengthLabel("StrongerPass12")).toBe("strong");
  });
});
