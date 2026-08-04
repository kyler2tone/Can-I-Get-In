"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/usernames/availability?username=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        setAvailability((await response.json()) as Availability);
      } catch {
        if (!controller.signal.aborted) {
          setAvailability({
            available: false,
            normalized: trimmed,
            message: "Could not check that username right now.",
          });
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [value]);

  return (
    <label className="block text-sm font-medium">
      Username
      <input
        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
        name={name}
        onChange={(event) => {
          setValue(event.target.value);
          if (event.target.value.trim().length < 3) {
            setAvailability(null);
          }
        }}
        pattern="[a-z0-9_-]{3,32}"
        defaultValue={defaultValue}
        autoComplete="username"
        required
      />
      <span
        className={`mt-1 block text-xs ${
          availability?.available ? "text-emerald-800" : "text-muted"
        }`}
        role="status"
      >
        {availability?.message ??
          "Use 3-32 lowercase letters, numbers, underscores, or hyphens."}
      </span>
    </label>
  );
}
