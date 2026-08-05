export const avatarBucket = "avatars";
export const avatarMaxBytes = 5 * 1024 * 1024;
export const avatarMaxMegabytes = 5;
export const avatarOutputSize = 512;
export const avatarStorageFileName = "avatar.webp";

export const allowedAvatarTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export type AvatarValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export function validateAvatarFile(file: Pick<File, "size" | "type">): AvatarValidationResult {
  if (!allowedAvatarTypes.includes(file.type as (typeof allowedAvatarTypes)[number])) {
    return { ok: false, message: "Upload a PNG, JPEG, or WebP image." };
  }

  if (file.size > avatarMaxBytes) {
    return { ok: false, message: `Avatar uploads must be ${avatarMaxMegabytes} MB or smaller.` };
  }

  return { ok: true };
}

export function buildAvatarStoragePath(userId: string) {
  return `${userId}/${avatarStorageFileName}`;
}

export function isOwnAvatarPublicUrl(avatarUrl: string, userId: string, supabaseUrl: string) {
  try {
    const parsedAvatarUrl = new URL(avatarUrl);
    const parsedSupabaseUrl = new URL(supabaseUrl);
    const expectedPath = `/storage/v1/object/public/${avatarBucket}/${buildAvatarStoragePath(userId)}`;

    return parsedAvatarUrl.origin === parsedSupabaseUrl.origin && parsedAvatarUrl.pathname === expectedPath;
  } catch {
    return false;
  }
}

export function getInitials(displayName: string | null | undefined) {
  const parts = (displayName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "CI";

  return parts.map((part) => part[0]?.toUpperCase()).join("");
}
