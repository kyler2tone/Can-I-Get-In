"use client";

import { ImagePlus, RotateCcw, Trash2, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import {
  avatarBucket,
  avatarOutputSize,
  buildAvatarStoragePath,
  getInitials,
  validateAvatarFile,
} from "@/lib/avatar-upload";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AvatarUploaderProps = {
  userId: string;
  displayName: string | null;
  initialAvatarUrl: string | null;
};

async function resizeAvatar(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = Math.floor((bitmap.width - side) / 2);
  const sy = Math.floor((bitmap.height - side) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = avatarOutputSize;
  canvas.height = avatarOutputSize;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not prepare that image.");
  }

  context.drawImage(bitmap, sx, sy, side, side, 0, 0, avatarOutputSize, avatarOutputSize);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.86);
  });

  if (!blob) {
    throw new Error("Your browser could not compress that image.");
  }

  return new File([blob], "avatar.webp", { type: "image/webp" });
}

async function persistAvatarUrl(avatarUrl: string) {
  const response = await fetch("/settings/profile/avatar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ avatarUrl }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Could not save your avatar.");
  }
}

async function clearAvatar() {
  const response = await fetch("/settings/profile/avatar", { method: "DELETE" });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Could not remove your avatar.");
  }
}

export function AvatarUploader({
  userId,
  displayName,
  initialAvatarUrl,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(initialAvatarUrl ?? "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function uploadFile(file: File) {
    const validation = validateAvatarFile(file);
    if (!validation.ok) {
      setError(validation.message);
      setStatus("");
      return;
    }

    setPending(true);
    setError("");
    setStatus("Preparing image...");

    try {
      const resized = await resizeAvatar(file);
      const supabase = getSupabaseBrowserClient();
      const storagePath = buildAvatarStoragePath(userId);
      setStatus("Uploading avatar...");

      const { error: uploadError } = await supabase.storage
        .from(avatarBucket)
        .upload(storagePath, resized, {
          cacheControl: "3600",
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(avatarBucket).getPublicUrl(storagePath);

      await persistAvatarUrl(publicUrl);
      setAvatarUrl(publicUrl);
      setPreviewUrl(`${publicUrl}?v=${Date.now()}`);
      setStatus("Avatar updated.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload your avatar.");
      setStatus("");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setPending(true);
    setError("");
    setStatus("Removing avatar...");

    try {
      await clearAvatar();
      setAvatarUrl("");
      setPreviewUrl("");
      setStatus("Avatar removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove your avatar.");
      setStatus("");
    } finally {
      setPending(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files.item(0);
    if (file) void uploadFile(file);
  }

  return (
    <section className="space-y-3">
      <input name="avatarUrl" type="hidden" value={avatarUrl} />
      <div
        className="flex flex-col gap-4 rounded-md border border-dashed border-line bg-white p-4 sm:flex-row sm:items-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-xl font-semibold text-white">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={previewUrl} />
          ) : (
            <span>{getInitials(displayName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Avatar photo</h3>
            <p className="mt-1 text-sm text-muted">
              Upload a PNG, JPEG, or WebP. The image is cropped square and compressed before upload.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadFile(file);
              }}
              type="file"
            />
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:border-brand hover:text-brand-strong"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              {previewUrl ? <RotateCcw size={16} aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
              {previewUrl ? "Replace photo" : "Upload photo"}
            </button>
            {previewUrl ? (
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-950 transition hover:bg-rose-50"
                disabled={pending}
                onClick={() => void removeAvatar()}
                type="button"
              >
                <Trash2 size={16} aria-hidden="true" />
                Remove photo
              </button>
            ) : null}
          </div>
          <p className="flex items-center gap-2 text-xs text-muted">
            <Upload size={14} aria-hidden="true" />
            Drag and drop works on desktop.
          </p>
          {status ? <p className="text-sm text-emerald-800" role="status">{status}</p> : null}
          {error ? <p className="text-sm text-rose-700" role="alert">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}

