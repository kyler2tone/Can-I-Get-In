"use client";

import { useEffect, useState } from "react";
import { normalizeUsername, usernameSchema } from "@/lib/validation";

type Availability = {
  available: boolean;
  normalized: string;
  message: string;
};

export function UsernameField({
  defaultValue = "",
  name = "username",
}: {
  defaultValue?: string;
  name?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const parsed = usernameSchema.safeParse(value);
  const normalizedUsername = parsed.success ? parsed.data : "";
  const validationMessage = value && !parsed.success ? parsed.error.issues[0].message : "";
  const currentAvailability =
    parsed.success && availability?.normalized === normalizedUsername ? availability : null;

  useEffect(() => {
    if (!parsed.success) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/usernames/availability?username=${encodeURIComponent(normalizedUsername)}`,
          { signal: controller.signal },
        );
        setAvailability((await response.json()) as Availability);
      } catch {
        if (!controller.signal.aborted) {
          setAvailability({
            available: false,
            normalized: normalizedUsername,
            message: "Could not check that username right now.",
          });
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [normalizedUsername, parsed.success]);

  return (
    <label className="block text-sm font-medium">
      Username
      <input
        aria-describedby={`${name}-help`}
        aria-invalid={Boolean(validationMessage || currentAvailability?.available === false)}
        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 aria-invalid:border-rose-300"
        name={name}
        onChange={(event) => {
          setValue(normalizeUsername(event.target.value));
          setAvailability(null);
        }}
        pattern="[a-z0-9_-]{3,32}"
        value={value}
        autoComplete="username"
        required
      />
      <span
        id={`${name}-help`}
        className={`mt-1 block text-xs ${
          validationMessage || currentAvailability?.available === false
            ? "text-rose-700"
            : currentAvailability?.available
              ? "text-emerald-800"
              : "text-muted"
        }`}
        role={validationMessage || currentAvailability?.available === false ? "alert" : "status"}
      >
        {validationMessage ||
          currentAvailability?.message ||
          "Use 3-32 lowercase letters, numbers, underscores, or hyphens."}
      </span>
    </label>
  );
}
