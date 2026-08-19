"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LocateFixed, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placeCategories } from "@/lib/place-categories";
import { UnifiedPlaceSearch } from "@/components/places/unified-place-search";

type CreateResponse = {
  status: "existing" | "created" | "pending";
  message: string;
  place: {
    name?: string;
    contributeUrl: string;
  };
};

export function AddPlaceWorkflow() {
  const [manualState, setManualState] = useState<"idle" | "submitting" | "locating">("idle");
  const [manualMessage, setManualMessage] = useState("");
  const router = useRouter();

  async function submitManualPlace(formData: FormData) {
    setManualState("submitting");
    setManualMessage("Submitting place for review...");

    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/places/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as Partial<CreateResponse> & { message?: string };
      if (!response.ok || !result.place?.contributeUrl) {
        throw new Error(result.message ?? "This place could not be submitted.");
      }

      setManualMessage(result.message ?? "Place submitted.");
      router.push(result.place.contributeUrl);
      router.refresh();
    } catch (error) {
      setManualMessage(error instanceof Error ? error.message : "This place could not be submitted.");
      setManualState("idle");
    }
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setManualMessage("Your browser does not support location sharing.");
      return;
    }

    setManualState("locating");
    setManualMessage("Finding your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = document.getElementById("manual-latitude") as HTMLInputElement | null;
        const longitude = document.getElementById("manual-longitude") as HTMLInputElement | null;
        if (latitude) latitude.value = position.coords.latitude.toFixed(6);
        if (longitude) longitude.value = position.coords.longitude.toFixed(6);
        setManualMessage("Location added. Adjust it if the place is somewhere else.");
        setManualState("idle");
      },
      () => {
        setManualMessage("Location could not be added. You can enter coordinates manually.");
        setManualState("idle");
      },
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 10, timeout: 10000 },
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <UnifiedPlaceSearch existingAction="contribute" />
      </div>

      <aside className="space-y-6">
        <section className="border border-line bg-surface p-5">
          <h2 className="text-xl font-semibold">Can&apos;t find it?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Manual submissions go to Studio review before public discovery, but you can add photos right away.
          </p>
          <form action={submitManualPlace} className="mt-5 space-y-3">
            <TextField label="Place name" name="name" required />
            <TextField label="Address or location" name="address" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="City" name="city" required />
              <TextField label="State" name="state" required />
            </div>
            <TextField label="Postal code" name="postalCode" />
            <label className="block">
              <span className="text-sm font-medium">Category</span>
              <select
                className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3"
                name="category"
                required
                defaultValue=""
              >
                <option value="">Choose a category</option>
                {placeCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id="manual-latitude" label="Latitude" name="latitude" required />
              <TextField id="manual-longitude" label="Longitude" name="longitude" required />
            </div>
            <Button
              disabled={manualState === "locating" || manualState === "submitting"}
              onClick={useCurrentLocation}
              type="button"
              variant="secondary"
            >
              <LocateFixed size={16} aria-hidden="true" />
              Use my location
            </Button>
            <TextField label="Website" name="website" type="url" />
            <label className="block">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-line bg-white px-3 py-2"
                maxLength={500}
                name="notes"
              />
            </label>
            {manualMessage ? (
              <p className="rounded-md bg-sky-soft px-3 py-2 text-sm text-brand-strong" role="status">
                {manualMessage}
              </p>
            ) : null}
            <Button className="w-full" disabled={manualState === "submitting"} type="submit">
              <Plus size={16} aria-hidden="true" />
              {manualState === "submitting" ? "Submitting..." : "Submit and add photos"}
            </Button>
          </form>
        </section>
        <section className="border border-line bg-white p-5">
          <CheckCircle2 className="text-brand" size={22} aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold">What happens next?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Verified places publish immediately. Manual places stay out of public discovery until a moderator reviews them.
          </p>
        </section>
      </aside>
    </div>
  );
}

function TextField({
  label,
  name,
  id,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  id?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3"
        id={id}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}
