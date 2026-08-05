import { describe, expect, it } from "vitest";
import {
  getCallbackErrorDestination,
  getPostAuthDestination,
} from "@/lib/auth-callback";

describe("auth callback routing", () => {
  it("sends incomplete profiles to onboarding", () => {
    expect(
      getPostAuthDestination({
        profile: { profile_completed: false },
        requestedNext: "/dashboard",
      }),
    ).toBe("/onboarding/profile");
  });

  it("sends completed profiles to a safe requested destination", () => {
    expect(
      getPostAuthDestination({
        profile: { profile_completed: true },
        requestedNext: "/settings/account",
      }),
    ).toBe("/settings/account");
  });

  it("falls back completed profiles to dashboard", () => {
    expect(
      getPostAuthDestination({
        profile: { profile_completed: true },
        requestedNext: "//example.com",
      }),
    ).toBe("/dashboard");
  });

  it("routes recovery links to reset password", () => {
    expect(
      getPostAuthDestination({
        profile: { profile_completed: true },
        authType: "recovery",
      }),
    ).toBe("/auth/reset-password");
  });

  it("creates a useful login error destination", () => {
    expect(getCallbackErrorDestination("No sign-in code was provided.")).toBe(
      "/auth/login?message=No%20sign-in%20code%20was%20provided.",
    );
  });
});
