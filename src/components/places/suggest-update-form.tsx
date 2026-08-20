"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  accessibilityFactors,
  accessibilityStatusValues,
  getAccessibilityStatusLabel,
  type AccessibilityFactorKey,
  type AccessibilityStatus,
} from "@/lib/accessibility-factors";

export function SuggestUpdateForm({ placeId }: { placeId: string }) {
  const [selectedFactors, setSelectedFactors] = useState<AccessibilityFactorKey[]>([]);
  const [suggestedStatus, setSuggestedStatus] = useState<AccessibilityStatus | "">("");
  const [explanation, setExplanation] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitUpdate() {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/places/suggest-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          factors: selectedFactors,
          suggestedStatus: suggestedStatus || null,
          explanation,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Update could not be submitted.");
      setMessage(payload.message ?? "Thanks. Your update was submitted for review.");
      setSelectedFactors([]);
      setSuggestedStatus("");
      setExplanation("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="border border-line bg-surface p-5" aria-labelledby="suggest-update">
      <h2 id="suggest-update" className="text-lg font-semibold">
        Suggest an update
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Tell us if displayed accessibility information looks incorrect or outdated.
      </p>
      <div className="mt-4 space-y-3">
        <fieldset>
          <legend className="text-sm font-semibold">Affected details</legend>
          <div className="mt-2 grid gap-2">
            {accessibilityFactors.map((factor) => (
              <label className="flex items-center gap-2 text-sm" key={factor.key}>
                <input
                  checked={selectedFactors.includes(factor.key)}
                  onChange={(event) =>
                    setSelectedFactors((current) =>
                      event.target.checked
                        ? [...current, factor.key]
                        : current.filter((item) => item !== factor.key),
                    )
                  }
                  type="checkbox"
                  value={factor.key}
                />
                {factor.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Suggested status
          <select
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
            onChange={(event) => setSuggestedStatus(event.target.value as AccessibilityStatus | "")}
            value={suggestedStatus}
          >
            <option value="">No specific status</option>
            {accessibilityStatusValues.map((status) => (
              <option key={status} value={status}>
                {getAccessibilityStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          What changed or looks incorrect?
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-line bg-white px-3 py-2"
            maxLength={1000}
            onChange={(event) => setExplanation(event.target.value)}
            required
            value={explanation}
          />
        </label>
        {message ? (
          <p className="rounded-md bg-sky-soft px-3 py-2 text-sm text-brand-strong" role="status">
            {message}
          </p>
        ) : null}
        <Button disabled={isSubmitting || explanation.trim().length < 3} onClick={submitUpdate} type="button">
          <Send size={16} aria-hidden="true" />
          {isSubmitting ? "Submitting..." : "Submit update"}
        </Button>
      </div>
    </section>
  );
}
