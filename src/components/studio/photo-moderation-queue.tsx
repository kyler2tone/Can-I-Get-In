"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { approvePhotoAction, rejectPhotoAction } from "@/lib/studio-actions";
import type { StudioPhoto } from "@/lib/studio";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
};

export function PhotoModerationQueue({ photos }: { photos: StudioPhoto[] }) {
  const [queue, setQueue] = useState(photos);
  const [busyAction, setBusyAction] = useState<Record<string, "approve" | "reject">>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(handle);
  }, [toast]);

  function reviewPhoto(photoId: string, action: "approve" | "reject") {
    if (busyAction[photoId]) return;
    setBusyAction((current) => ({ ...current, [photoId]: action }));
    const formData = new FormData();
    formData.set("photoId", photoId);

    startTransition(async () => {
      try {
        const result =
          action === "approve"
            ? await approvePhotoAction(formData)
            : await rejectPhotoAction(formData);

        setQueue((current) => current.filter((photo) => photo.id !== result.photoId));
        setToast({ id: Date.now(), message: result.message, tone: "success" });
        window.dispatchEvent(new CustomEvent("studio:queue-reviewed", { detail: { queue: "photos" } }));
      } catch {
        setToast({
          id: Date.now(),
          message: action === "approve" ? "Couldn't approve photo. Try again." : "Couldn't reject photo. Try again.",
          tone: "error",
        });
      } finally {
        setBusyAction((current) => {
          const next = { ...current };
          delete next[photoId];
          return next;
        });
      }
    });
  }

  if (!queue.length) {
    return (
      <>
        <ToastMessage toast={toast} />
        <div className="border border-dashed border-line bg-surface p-6">
          <h2 className="text-xl font-semibold">No photos are awaiting review.</h2>
          <p className="mt-2 text-sm text-muted">
            New Contributor uploads will appear here before they are shown publicly.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastMessage toast={toast} />
      <div className="grid gap-5">
        {queue.map((photo) => {
          const action = busyAction[photo.id];
          const isBusy = Boolean(action);

          return (
            <article className="border border-line bg-surface" key={photo.id}>
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="bg-background">
                  {photo.signedUrl ? (
                    <img
                      alt={`${photo.categoryLabel} photo awaiting review`}
                      className="max-h-[520px] w-full object-contain"
                      src={photo.signedUrl}
                    />
                  ) : (
                    <div className="grid min-h-80 place-items-center px-4 text-center text-sm text-muted">
                      Photo preview is unavailable.
                    </div>
                  )}
                </div>
                <div className="space-y-4 border-t border-line p-4 lg:border-l lg:border-t-0">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                      Pending photo
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">{photo.placeName}</h2>
                    {photo.placeSlug ? (
                      <Link
                        className="mt-1 inline-flex text-sm font-semibold text-brand-strong underline"
                        href={`/places/${photo.placeSlug}`}
                      >
                        View place page
                      </Link>
                    ) : null}
                    <p className="mt-2 text-sm text-muted">{photo.placeAddress}</p>
                  </div>
                  <dl className="grid gap-3 text-sm">
                    <div>
                      <dt className="font-semibold">Category</dt>
                      <dd className="text-muted">{photo.categoryLabel}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Contributor</dt>
                      <dd className="text-muted">
                        {photo.contributorUsername ? (
                          <Link href={`/contributors/${photo.contributorUsername}`}>
                            {photo.contributorName}
                          </Link>
                        ) : (
                          photo.contributorName
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Uploaded</dt>
                      <dd className="text-muted">{formatDate(photo.uploadedAt)}</dd>
                    </div>
                  </dl>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <button
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brand bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:active:translate-y-0"
                      disabled={isBusy}
                      onClick={() => reviewPhoto(photo.id, "approve")}
                      type="button"
                    >
                      {action === "approve" ? "Approving..." : "Approve"}
                    </button>
                    <button
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:border-rose-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:active:translate-y-0"
                      disabled={isBusy}
                      onClick={() => reviewPhoto(photo.id, "reject")}
                      type="button"
                    >
                      {action === "reject" ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function ToastMessage({ toast }: { toast: Toast | null }) {
  return (
    <div className="fixed right-4 top-20 z-50" aria-live="polite" aria-atomic="true">
      {toast ? (
        <p
          className={`rounded-md border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-rose-200 bg-rose-50 text-rose-950"
          }`}
          key={toast.id}
          role="status"
        >
          {toast.message}
        </p>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
