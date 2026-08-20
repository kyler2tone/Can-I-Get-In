"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, RefreshCw, Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  buildPhotoStoragePath,
  objectPathFromDatabasePath,
  safePhotoFilename,
  validateCompressedImage,
  validateImageFile,
} from "@/lib/photo-upload";
import { photoCategories, type PhotoCategory } from "@/lib/photo-categories";
import type { PlacePhoto } from "@/lib/places";
import {
  accessibilityFactorOptions,
  accessibilityFactors,
  type AccessibilityFactorKey,
  type AccessibilityStatus,
} from "@/lib/accessibility-factors";
import { contributorNotesMaxLength } from "@/lib/accessibility-validation";

type QueuedPhoto = {
  id: string;
  original: File;
  file: File;
  previewUrl: string;
  category: PhotoCategory;
  progress: number;
  status: "ready" | "compressing" | "uploading" | "saving" | "done" | "error";
  message: string;
};

type ContributorObservationValue =
  | ""
  | AccessibilityStatus;

type PhotoUploaderProps = {
  placeId: string;
  placeSlug: string;
  userId: string;
  existingPhotos: PlacePhoto[];
  initialCategory?: PhotoCategory;
};

const compressionMaxDimension = 2200;
const compressionQuality = 0.82;

export function PhotoUploader({
  placeId,
  placeSlug,
  userId,
  existingPhotos,
  initialCategory = "entrance_overview",
}: PhotoUploaderProps) {
  const [queuedPhotos, setQueuedPhotos] = useState<QueuedPhoto[]>([]);
  const [category, setCategory] = useState<PhotoCategory>(initialCategory);
  const [notice, setNotice] = useState("");
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessibilityNotes, setAccessibilityNotes] = useState("");
  const [contributorObservations, setContributorObservations] = useState<
    Partial<Record<AccessibilityFactorKey, ContributorObservationValue>>
  >({});
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const ownPhotos = useMemo(
    () => existingPhotos.filter((photo) => photo.canManage),
    [existingPhotos],
  );

  async function prepareFiles(files: FileList | File[]) {
    setNotice("");
    const incoming = Array.from(files);
    const prepared: QueuedPhoto[] = [];

    for (const file of incoming) {
      const validation = validateImageFile(file);
      if (!validation.ok) {
        prepared.push(errorQueueItem(file, validation.message));
        continue;
      }

      try {
        const compressed = await compressImage(file);
        const compressedValidation = validateCompressedImage(compressed);

        prepared.push({
          id: crypto.randomUUID(),
          original: file,
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          category,
          progress: 0,
          status: compressedValidation.ok ? "ready" : "error",
          message: compressedValidation.ok
            ? compressionMessage(file, compressed)
            : compressedValidation.message,
        });
      } catch {
        prepared.push(errorQueueItem(file, `Could not prepare ${file.name}.`));
      }
    }

    setQueuedPhotos((current) => [...current, ...prepared]);
  }

  async function uploadAll() {
    if (accessibilityNotes.length > contributorNotesMaxLength) {
      setNotice(`Notes must be ${contributorNotesMaxLength} characters or fewer.`);
      return;
    }

    setIsSubmitting(true);
    setNotice("");
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setNotice("Please sign in again before uploading photos.");
      setIsSubmitting(false);
      return;
    }

    const uploadedPhotoIds: string[] = [];

    for (const photo of queuedPhotos) {
      if (photo.status !== "ready") continue;

      setQueuedPhoto(photo.id, { status: "uploading", progress: 1, message: "Uploading..." });
      const fileName = safePhotoFilename(photo.file.name);
      const paths = buildPhotoStoragePath(placeId, userId, fileName);

      try {
        await uploadWithProgress({
          file: photo.file,
          objectPath: paths.objectPath,
          accessToken: session.access_token,
          onProgress: (progress) => setQueuedPhoto(photo.id, { progress }),
        });

        setQueuedPhoto(photo.id, { status: "saving", message: "Saving photo record..." });

        const { data: insertedPhoto, error } = await supabase
          .from("place_photos")
          .insert({
            place_id: placeId,
            uploader_id: userId,
            storage_path: paths.databasePath,
            category: photo.category,
            moderation_status: "pending",
          })
          .select("id")
          .single();

        if (error) {
          await supabase.storage.from("place-photos").remove([paths.objectPath]);
          throw error;
        }

        if (insertedPhoto?.id) {
          uploadedPhotoIds.push(insertedPhoto.id);
          void fetch("/api/photos/moderate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoId: insertedPhoto.id }),
          }).catch(() => undefined);
        }

        setQueuedPhoto(photo.id, {
          status: "done",
          progress: 100,
          message: "Uploaded. This photo is pending review and visible to you now.",
        });
      } catch (error) {
        setQueuedPhoto(photo.id, {
          status: "error",
          message: error instanceof Error ? error.message : "Upload failed.",
        });
        setNotice("Some photos could not be uploaded. Fix the errors and try again.");
        setIsSubmitting(false);
        return;
      }
    }

    if (hasContributorEvidence(contributorObservations, accessibilityNotes)) {
      const response = await fetch("/api/contributions/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          photoIds: uploadedPhotoIds,
          observations: cleanContributorObservations(contributorObservations),
          notes: accessibilityNotes,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setNotice(payload.message ?? "Accessibility observations could not be saved. Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    setNotice("Contribution submitted. Photos are pending review.");
    setIsSubmitting(false);
    router.push(`/places/${placeSlug}`);
    router.refresh();
  }

  async function deletePhoto(photo: PlacePhoto) {
    const confirmed = window.confirm("Delete this photo?");
    if (!confirmed) return;

    setBusyPhotoId(photo.id);
    setNotice("");

    try {
      const response = await fetch("/api/photos/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Photo could not be deleted.");
      setNotice(payload.message ?? "Photo deleted.");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Photo could not be deleted.");
    } finally {
      setBusyPhotoId(null);
    }
  }

  async function replacePhoto(photo: PlacePhoto, file: File) {
    setBusyPhotoId(photo.id);
    setNotice("");
    const validation = validateImageFile(file);

    if (!validation.ok) {
      setNotice(validation.message);
      setBusyPhotoId(null);
      return;
    }

    try {
      const compressed = await compressImage(file);
      const compressedValidation = validateCompressedImage(compressed);
      if (!compressedValidation.ok) throw new Error(compressedValidation.message);

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again before replacing photos.");

      const paths = buildPhotoStoragePath(placeId, userId, safePhotoFilename(compressed.name));

      await uploadWithProgress({
        file: compressed,
        objectPath: paths.objectPath,
        accessToken: session.access_token,
        onProgress: () => undefined,
      });

      const { error } = await supabase
        .from("place_photos")
        .update({
          storage_path: paths.databasePath,
          category: photo.category,
          moderation_status: "pending",
        })
        .eq("id", photo.id);

      if (error) {
        await supabase.storage.from("place-photos").remove([paths.objectPath]);
        throw error;
      }

      await supabase.storage
        .from("place-photos")
        .remove([objectPathFromDatabasePath(photo.storage_path)]);

      router.push(`/places/${placeSlug}`);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not replace the photo.");
      setBusyPhotoId(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    void prepareFiles(event.dataTransfer.files);
  }

  function setQueuedPhoto(id: string, patch: Partial<QueuedPhoto>) {
    setQueuedPhotos((current) =>
      current.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)),
    );
  }

  function removeQueuedPhoto(id: string) {
    setQueuedPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  }

  const readyCount = queuedPhotos.filter((photo) => photo.status === "ready").length;

  return (
    <div className="space-y-6">
      <section className="border border-line bg-surface p-5">
        <h2 className="text-xl font-semibold">Add photos</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Choose a category before submitting. Large images are compressed in your browser
          before upload.
        </p>

        <label className="mt-5 block text-sm font-medium">
          Photo category
          <select
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
            onChange={(event) => setCategory(event.target.value as PhotoCategory)}
            value={category}
          >
            {photoCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label
          className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line bg-white px-4 py-8 text-center transition hover:border-brand"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <UploadCloud className="text-brand" size={32} aria-hidden="true" />
          <span className="font-semibold">Drop photos here or choose files</span>
          <span className="text-sm text-muted">JPEG, PNG, or WebP. Maximum 15 MB after compression.</span>
          <input
            ref={pickerRef}
            accept="image/*"
            className="sr-only"
            multiple
            onChange={(event) => {
              if (event.target.files) void prepareFiles(event.target.files);
              event.target.value = "";
            }}
            type="file"
          />
        </label>

        <input
          ref={cameraRef}
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void prepareFiles(event.target.files);
            event.target.value = "";
          }}
          type="file"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button onClick={() => cameraRef.current?.click()} type="button" variant="secondary">
            <Camera size={18} aria-hidden="true" />
            Use camera
          </Button>
          <Button onClick={() => pickerRef.current?.click()} type="button" variant="secondary">
            <ImagePlus size={18} aria-hidden="true" />
            Choose from gallery
          </Button>
        </div>
      </section>

      <section className="border border-line bg-surface p-5">
        <h2 className="text-xl font-semibold">Accessibility observations</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Optional details can help summarize what the photos document. Choose “Not sure”
          whenever something is unclear.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {accessibilityFactors.map((factor) => (
            <label className="block text-sm font-medium" key={factor.key}>
              {factor.label}
              <select
                className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
                onChange={(event) =>
                  setContributorObservations((current) => ({
                    ...current,
                    [factor.key]: event.target.value as ContributorObservationValue,
                  }))
                }
                value={contributorObservations[factor.key] ?? ""}
              >
                <option value="">No observation</option>
                {accessibilityFactorOptions[factor.key].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium">
          Accessibility notes <span className="font-normal text-muted">(optional)</span>
          <textarea
            className="mt-1 min-h-28 w-full rounded-md border border-line bg-white px-3 py-2"
            aria-describedby="accessibility-notes-count"
            maxLength={contributorNotesMaxLength}
            onChange={(event) => setAccessibilityNotes(event.target.value)}
            placeholder="Share anything you noticed about getting into or moving through this place."
            value={accessibilityNotes}
          />
          <span
            className="mt-1 block text-xs text-muted"
            id="accessibility-notes-count"
            aria-live="polite"
          >
            {accessibilityNotes.length} / {contributorNotesMaxLength}
          </span>
        </label>
      </section>

      <section className="border border-line bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Ready to submit</h2>
            <p className="mt-1 text-sm text-muted">
              Submit photos, categories, accessibility observations, and notes together.
            </p>
          </div>
          <Button disabled={isSubmitting || (!readyCount && !hasContributorEvidence(contributorObservations, accessibilityNotes))} onClick={uploadAll} type="button">
            {isSubmitting ? "Submitting..." : "Submit contribution"}
          </Button>
        </div>
        {queuedPhotos.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {queuedPhotos.map((photo) => (
              <article className="border border-line bg-white" key={photo.id}>
                {photo.previewUrl ? (
                  <img alt="" className="h-48 w-full object-cover" src={photo.previewUrl} />
                ) : (
                  <div className="grid h-48 place-items-center bg-background px-4 text-center text-sm text-muted">
                    {photo.message}
                  </div>
                )}
                <div className="space-y-3 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{photo.file.name}</p>
                      <p className="text-xs text-muted">{photo.message}</p>
                    </div>
                    <button
                      className="grid size-8 place-items-center rounded-md border border-line"
                      onClick={() => removeQueuedPhoto(photo.id)}
                      title="Remove from upload queue"
                      type="button"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <select
                    className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                    disabled={photo.status === "uploading" || photo.status === "saving"}
                    onChange={(event) =>
                      setQueuedPhoto(photo.id, { category: event.target.value as PhotoCategory })
                    }
                    value={photo.category}
                  >
                    {photoCategories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <div>
                    <div className="h-2 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full bg-brand transition-all"
                        style={{ width: `${photo.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">{photo.status}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="border border-line bg-surface p-5">
        <h2 className="text-xl font-semibold">Your uploaded photos</h2>
        {notice ? (
          <p className="mt-3 rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-950">
            {notice}
          </p>
        ) : null}
        {ownPhotos.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {ownPhotos.map((photo) => (
              <article className="border border-line bg-white" key={photo.id}>
                {photo.signedUrl ? (
                  <img
                    alt=""
                    className="h-44 w-full object-cover"
                    src={photo.signedUrl}
                  />
                ) : (
                  <div className="grid h-44 place-items-center bg-background text-sm text-muted">
                    Preview unavailable
                  </div>
                )}
                <div className="space-y-3 p-3">
                  <p className="text-sm text-muted">{photo.category.replaceAll("_", " ")}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold">
                      <RefreshCw size={16} aria-hidden="true" />
                      Replace
                      <input
                        accept="image/*"
                        className="sr-only"
                        disabled={busyPhotoId === photo.id}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void replacePhoto(photo, file);
                          event.target.value = "";
                        }}
                        type="file"
                      />
                    </label>
                    <button
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-rose-900"
                      disabled={busyPhotoId === photo.id}
                      onClick={() => void deletePhoto(photo)}
                      type="button"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      {busyPhotoId === photo.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">You have not uploaded photos for this place yet.</p>
        )}
      </section>
    </div>
  );
}

function cleanContributorObservations(
  observations: Partial<Record<AccessibilityFactorKey, ContributorObservationValue>>,
) {
  return Object.fromEntries(
    Object.entries(observations).filter(([, value]) => Boolean(value)),
  );
}

function hasContributorEvidence(
  observations: Partial<Record<AccessibilityFactorKey, ContributorObservationValue>>,
  notes: string,
) {
  return Object.keys(cleanContributorObservations(observations)).length > 0 || notes.trim().length > 0;
}

function errorQueueItem(file: File, message: string): QueuedPhoto {
  return {
    id: crypto.randomUUID(),
    original: file,
    file,
    previewUrl: "",
    category: "other",
    progress: 0,
    status: "error",
    message,
  };
}

function compressionMessage(original: File, compressed: File) {
  if (compressed.size < original.size) {
    return `Compressed from ${formatBytes(original.size)} to ${formatBytes(compressed.size)}.`;
  }

  return `${formatBytes(compressed.size)} ready to upload.`;
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, compressionMaxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Could not prepare the image for upload.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, outputType === "image/png" ? undefined : compressionQuality);
  });

  if (!blob) {
    throw new Error("Could not compress the image.");
  }

  if (blob.size >= file.size && file.size <= 15 * 1024 * 1024) {
    return file;
  }

  const extension = outputType === "image/png" ? "png" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, `.${extension}`);
  return new File([blob], name, { type: outputType, lastModified: Date.now() });
}

function uploadWithProgress({
  file,
  objectPath,
  accessToken,
  onProgress,
}: {
  file: File;
  objectPath: string;
  accessToken: string;
  onProgress: (progress: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    xhr.open(
      "POST",
      `${supabaseUrl}/storage/v1/object/place-photos/${encodeURIComponentObjectPath(objectPath)}`,
    );
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", publishableKey ?? "");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(readStorageError(xhr.responseText)));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading the photo."));
    xhr.send(file);
  });
}

function encodeURIComponentObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function readStorageError(responseText: string) {
  try {
    const parsed = JSON.parse(responseText) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? "Storage upload failed.";
  } catch {
    return "Storage upload failed.";
  }
}
