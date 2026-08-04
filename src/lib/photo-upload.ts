import { z } from "zod";
import { isPhotoCategory, photoCategoryValues, type PhotoCategory } from "@/lib/photo-categories";

export const maxUploadBytes = 15 * 1024 * 1024;
export const maxUploadMegabytes = 15;

export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export const photoUploadSchema = z.object({
  placeId: z.string().uuid(),
  category: z.enum(photoCategoryValues as [PhotoCategory, ...PhotoCategory[]]),
});

export function validateImageFile(file: Pick<File, "size" | "type" | "name">): UploadValidationResult {
  if (!file.type.startsWith("image/")) {
    return { ok: false, message: `${file.name} is not an image.` };
  }

  if (!allowedImageTypes.includes(file.type as (typeof allowedImageTypes)[number])) {
    return {
      ok: false,
      message: `${file.name} must be a JPEG, PNG, or WebP image.`,
    };
  }

  if (file.size <= 0) {
    return { ok: false, message: `${file.name} appears to be empty.` };
  }

  return { ok: true };
}

export function validateCompressedImage(file: Pick<File, "size" | "name">): UploadValidationResult {
  if (file.size > maxUploadBytes) {
    return {
      ok: false,
      message: `${file.name} is still larger than ${maxUploadMegabytes} MB after compression.`,
    };
  }

  return { ok: true };
}

export function safePhotoFilename(fileName: string, now = Date.now()) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${now}-${base || "photo"}.${extension}`;
}

export function buildPhotoStoragePath(placeId: string, userId: string, fileName: string) {
  return {
    objectPath: `${placeId}/${userId}/${fileName}`,
    databasePath: `place-photos/${placeId}/${userId}/${fileName}`,
  };
}

export function objectPathFromDatabasePath(databasePath: string) {
  return databasePath.replace(/^place-photos\//, "");
}

export function validatePhotoCategory(value: string): UploadValidationResult {
  if (!isPhotoCategory(value)) {
    return { ok: false, message: "Choose a supported photo category." };
  }

  return { ok: true };
}
