"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { acceptUpdateRequestAction, rejectUpdateRequestAction } from "@/lib/studio-actions";
import { getAccessibilityFactorLabel, getAccessibilityFactorStatusLabel } from "@/lib/accessibility-factors";
import type { StudioUpdateRequest } from "@/lib/studio";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
};

export function UpdateRequestQueue({ updates }: { updates: StudioUpdateRequest[] }) {
  const [queue, setQueue] = useState(updates);
  const [busyAction, setBusyAction] = useState<Record<string, "accept" | "reject">>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(handle);
  }, [toast]);

  function reviewUpdate(updateId: string, action: "accept" | "reject") {
    if (busyAction[updateId]) return;
    setBusyAction((current) => ({ ...current, [updateId]: action }));
    const formData = new FormData();
    formData.set("updateId", updateId);

    startTransition(async () => {
      try {
        const result =
          action === "accept"
            ? await acceptUpdateRequestAction(formData)
            : await rejectUpdateRequestAction(formData);

        setQueue((current) => current.filter((update) => update.id !== result.updateId));
        setToast({ id: Date.now(), message: result.message, tone: "success" });
        window.dispatchEvent(new CustomEvent("studio:queue-reviewed", { detail: { queue: "updates" } }));
      } catch {
        setToast({
          id: Date.now(),
          message: action === "accept" ? "Couldn't accept update. Try again." : "Couldn't reject update. Try again.",
          tone: "error",
        });
      } finally {
        setBusyAction((current) => {
          const next = { ...current };
          delete next[updateId];
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
          <h2 className="text-xl font-semibold">No suggested updates are awaiting review.</h2>
          <p className="mt-2 text-sm text-muted">
            Contributor corrections will appear here when public information may need attention.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastMessage toast={toast} />
      <div className="grid gap-4">
      {queue.map((update) => {
        const action = busyAction[update.id];
        const isBusy = Boolean(action);

        return (
        <article className="border border-line bg-surface p-5" key={update.id}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Suggested update
              </p>
              <h2 className="mt-2 text-xl font-semibold">{update.placeName}</h2>
              {update.placeSlug ? (
                <Link
                  className="mt-1 inline-flex text-sm font-semibold text-brand-strong underline"
                  href={`/places/${update.placeSlug}`}
                >
                  View place page
                </Link>
              ) : null}
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold">Affected details</dt>
                  <dd className="text-muted">
                    {update.factors.length
                      ? update.factors.map(getAccessibilityFactorLabel).join(", ")
                      : "General update"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Suggested status</dt>
                  <dd className="text-muted">{formatStatus(update.suggestedStatus, update.factors)}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Contributor</dt>
                  <dd className="text-muted">
                    {update.contributorUsername ? (
                      <Link href={`/contributors/${update.contributorUsername}`}>
                        {update.contributorName}
                      </Link>
                    ) : (
                      update.contributorName
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Submitted</dt>
                  <dd className="text-muted">{formatDate(update.submittedAt)}</dd>
                </div>
              </dl>
              <p className="mt-4 rounded-md bg-white p-3 text-sm leading-6 text-muted">
                {update.explanation}
              </p>
            </div>
            <div className="grid content-start gap-2">
              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brand bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                onClick={() => reviewUpdate(update.id, "accept")}
                type="button"
              >
                {action === "accept" ? "Accepting..." : "Accept"}
              </button>
              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                onClick={() => reviewUpdate(update.id, "reject")}
                type="button"
              >
                {action === "reject" ? "Rejecting..." : "Reject"}
              </button>
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

function formatStatus(value: string, factors: string[]) {
  if (!value) return "No specific status";
  if (factors.length === 1) return getAccessibilityFactorStatusLabel(factors[0], value);
  if (["yes", "no", "unknown"].includes(value)) return getAccessibilityFactorStatusLabel("step_free_entrance", value);
  return "Review requested";
}
