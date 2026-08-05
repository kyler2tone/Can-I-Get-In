import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAuthCallbackUrl,
  getAuthExchangeCallbackUrl,
  getSiteUrl,
  normalizeCallbackNext,
} from "@/lib/auth-urls";

describe("auth URL helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_SITE_URL for callback redirects", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://canigetin.app/");

    expect(getSiteUrl()).toBe("https://canigetin.app");
    expect(getAuthExchangeCallbackUrl()).toBe("https://canigetin.app/auth/callback");
    expect(getAuthCallbackUrl("/onboarding/profile")).toBe(
      "https://canigetin.app/auth/callback?next=%2Fonboarding%2Fprofile",
    );
  });

  it("rejects unsafe callback destinations", () => {
    expect(normalizeCallbackNext("https://example.com")).toBe("/dashboard");
    expect(normalizeCallbackNext("//example.com")).toBe("/dashboard");
    expect(normalizeCallbackNext("/settings/account")).toBe("/settings/account");
  });
});
