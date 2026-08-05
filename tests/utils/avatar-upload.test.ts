import { describe, expect, it } from "vitest";
import {
  avatarMaxBytes,
  buildAvatarStoragePath,
  getInitials,
  isOwnAvatarPublicUrl,
  validateAvatarFile,
} from "@/lib/avatar-upload";

describe("avatar upload helpers", () => {
  it("accepts supported avatar image types within the size limit", () => {
    expect(validateAvatarFile({ size: avatarMaxBytes, type: "image/webp" })).toEqual({ ok: true });
    expect(validateAvatarFile({ size: 1000, type: "image/png" })).toEqual({ ok: true });
    expect(validateAvatarFile({ size: 1000, type: "image/jpeg" })).toEqual({ ok: true });
  });

  it("rejects unsupported avatar files", () => {
    expect(validateAvatarFile({ size: 1000, type: "image/gif" })).toEqual({
      ok: false,
      message: "Upload a PNG, JPEG, or WebP image.",
    });
    expect(validateAvatarFile({ size: avatarMaxBytes + 1, type: "image/webp" })).toEqual({
      ok: false,
      message: "Avatar uploads must be 5 MB or smaller.",
    });
  });

  it("builds owner-scoped avatar paths and initials", () => {
    expect(buildAvatarStoragePath("user-1")).toBe("user-1/avatar.webp");
    expect(getInitials("Kyler Schroeder")).toBe("KS");
    expect(getInitials("")).toBe("CI");
  });

  it("recognizes only the user's own Supabase public avatar URL", () => {
    expect(
      isOwnAvatarPublicUrl(
        "https://project.supabase.co/storage/v1/object/public/avatars/user-1/avatar.webp",
        "user-1",
        "https://project.supabase.co",
      ),
    ).toBe(true);
    expect(
      isOwnAvatarPublicUrl(
        "https://project.supabase.co/storage/v1/object/public/avatars/user-2/avatar.webp",
        "user-1",
        "https://project.supabase.co",
      ),
    ).toBe(false);
  });
});
