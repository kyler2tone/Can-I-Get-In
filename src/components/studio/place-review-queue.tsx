"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import {
  approvePlaceAction,
  correctAndApprovePlaceAction,
  rejectPlaceAction,
} from "@/lib/studio-actions";
import type { StudioPlace } from "@/lib/studio";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
};

export function PlaceReviewQueue({ places }: { places: StudioPlace[] }) {
  const [queue, setQueue] = useState(places);
  const [busyAction, setBusyAction] = useState<Record<string, "approve" | "reject" | "correct">>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(handle);
  }, [toast]);

  function reviewPlace(placeId: string, action: "approve" | "reject", formData?: FormData) {
    if (busyAction[placeId]) return;
    setBusyAction((current) => ({ ...current, [placeId]: action }));
    const payload = formData ?? new FormData();
    payload.set("placeId", placeId);

    startTransition(async () => {
      try {
        const result =
          action === "approve"
            ? await approvePlaceAction(payload)
            : await rejectPlaceAction(payload);

        setQueue((current) => current.filter((place) => place.id !== result.placeId));
        setToast({ id: Date.now(), message: result.message, tone: "success" });
        window.dispatchEvent(new CustomEvent("studio:queue-reviewed", { detail: { queue: "places" } }));
      } catch {
        setToast({
          id: Date.now(),
          message: action === "approve" ? "Couldn't approve place. Try again." : "Couldn't reject place. Try again.",
          tone: "error",
        });
      } finally {
        setBusyAction((current) => {
          const next = { ...current };
          delete next[placeId];
          return next;
        });
      }
    });
  }

  function correctAndApprove(placeId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction[placeId]) return;
    setBusyAction((current) => ({ ...current, [placeId]: "correct" }));
    const payload = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await correctAndApprovePlaceAction(payload);
        setQueue((current) => current.filter((place) => place.id !== result.placeId));
        setToast({ id: Date.now(), message: result.message, tone: "success" });
        window.dispatchEvent(new CustomEvent("studio:queue-reviewed", { detail: { queue: "places" } }));
      } catch {
        setToast({ id: Date.now(), message: "Couldn't save place review. Try again.", tone: "error" });
      } finally {
        setBusyAction((current) => {
          const next = { ...current };
          delete next[placeId];
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
          <h2 className="text-xl font-semibold">No places are awaiting review.</h2>
          <p className="mt-2 text-sm text-muted">
            Manual place submissions will appear here when they need a moderator.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastMessage toast={toast} />
      <div className="grid gap-5">
      {queue.map((place) => {
        const action = busyAction[place.id];
        const isBusy = Boolean(action);

        return (
        <article className="border border-line bg-surface p-5" key={place.id}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Pending place
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{place.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{place.address}</p>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Category" value={place.category} />
                <Info label="Submitted" value={formatDate(place.submittedAt)} />
                <Info label="Source" value={formatSource(place.source)} />
                <div>
                  <dt className="font-semibold">Contributor</dt>
                  <dd className="text-muted">
                    {place.contributorUsername ? (
                      <Link href={`/contributors/${place.contributorUsername}`}>
                        {place.contributorName}
                      </Link>
                    ) : (
                      place.contributorName
                    )}
                  </dd>
                </div>
              </dl>
              {place.verificationNotes ? (
                <p className="mt-5 rounded-md bg-white px-3 py-2 text-sm text-muted">
                  {place.verificationNotes}
                </p>
              ) : null}
              <section className="mt-5">
                <h3 className="font-semibold">Submitted photos</h3>
                {place.photos.length ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {place.photos.map((photo) => (
                      <figure className="border border-line bg-white" key={photo.id}>
                        {photo.signedUrl ? (
                          <img
                            alt={`${photo.categoryLabel} submitted with ${place.name}`}
                            className="h-36 w-full object-cover"
                            src={photo.signedUrl}
                          />
                        ) : (
                          <div className="grid h-36 place-items-center text-sm text-muted">
                            Preview unavailable
                          </div>
                        )}
                        <figcaption className="p-2 text-xs text-muted">
                          {photo.categoryLabel} · {photo.status}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted">No photos have been added yet.</p>
                )}
              </section>
            </div>
            <div className="space-y-3">
              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brand bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                onClick={() => reviewPlace(place.id, "approve")}
                type="button"
              >
                {action === "approve" ? "Approving..." : "Approve"}
              </button>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                onClick={() => reviewPlace(place.id, "reject")}
                type="button"
              >
                {action === "reject" ? "Rejecting..." : "Reject"}
              </button>
              <form className="space-y-3 border border-line bg-white p-3" onSubmit={(event) => correctAndApprove(place.id, event)}>
                <h3 className="font-semibold">Correct and approve</h3>
                <input name="placeId" type="hidden" value={place.id} />
                <label className="block">
                  <span className="text-sm font-medium">Name</span>
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-line px-3 text-sm"
                    defaultValue={place.name}
                    name="name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Address</span>
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-line px-3 text-sm"
                    defaultValue={place.address}
                    name="address"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Category</span>
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-line px-3 text-sm"
                    defaultValue={place.category}
                    name="category"
                  />
                </label>
                <button
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-line px-3 py-2 text-sm font-semibold transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isBusy}
                  type="submit"
                >
                  {action === "correct" ? "Approving..." : "Save and approve"}
                </button>
              </form>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold">{label}</dt>
      <dd className="text-muted">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSource(value: string) {
  if (value === "community_manual") return "Manual submission";
  if (value === "google_places") return "Verified lookup";
  return "Community";
}
