import { describe, expect, it } from "vitest";
import {
  buildPhotoStoragePath,
  objectPathFromDatabasePath,
  safePhotoFilename,
  validateCompressedImage,
  validateImageFile,
} from "@/lib/photo-upload";

describe("photo upload helpers", () => {
  it("validates image type before upload", () => {
    expect(validateImageFile({ name: "door.jpg", size: 100, type: "image/jpeg" }).ok).toBe(true);
    expect(validateImageFile({ name: "notes.pdf", size: 100, type: "application/pdf" }).ok).toBe(
      false,
    );
  });

  it("enforces the 15 MB post-compression limit", () => {
    expect(validateCompressedImage({ name: "route.jpg", size: 15 * 1024 * 1024 }).ok).toBe(true);
    expect(validateCompressedImage({ name: "route.jpg", size: 15 * 1024 * 1024 + 1 }).ok).toBe(
      false,
    );
  });

  it("builds user-scoped storage paths", () => {
    const placeId = "11111111-1111-4111-8111-111111111111";
    const userId = "22222222-2222-4222-8222-222222222222";
    const fileName = safePhotoFilename("Door Threshold.JPG", 123);

    expect(fileName).toBe("123-door-threshold.jpg");
    expect(buildPhotoStoragePath(placeId, userId, fileName)).toEqual({
      objectPath: `${placeId}/${userId}/${fileName}`,
      databasePath: `place-photos/${placeId}/${userId}/${fileName}`,
    });
    expect(objectPathFromDatabasePath(`place-photos/${placeId}/${userId}/${fileName}`)).toBe(
      `${placeId}/${userId}/${fileName}`,
    );
  });
});
