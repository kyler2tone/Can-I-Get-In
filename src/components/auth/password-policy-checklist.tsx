"use client";

import { Check, X } from "lucide-react";
import { validatePasswordPolicy } from "@/lib/password-policy";

export function PasswordPolicyChecklist({
  password,
  confirmation,
  showConfirmation = false,
}: {
  password: string;
  confirmation?: string;
  showConfirmation?: boolean;
}) {
  const result = validatePasswordPolicy(password, confirmation);

  return (
    <div
      aria-live="polite"
      className="rounded-md border border-line bg-white px-3 py-2 text-xs"
      role="status"
    >
      <p className="font-medium text-foreground">Password must include:</p>
      <ul className="mt-2 space-y-1">
        {result.requirements.map((requirement) => (
          <li
            className={requirement.met ? "flex items-center gap-2 text-emerald-800" : "flex items-center gap-2 text-muted"}
            key={requirement.id}
          >
            {requirement.met ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
            <span>{requirement.label}</span>
          </li>
        ))}
        {showConfirmation ? (
          <li
            className={
              result.confirmationMatches
                ? "flex items-center gap-2 text-emerald-800"
                : "flex items-center gap-2 text-muted"
            }
          >
            {result.confirmationMatches ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <X size={14} aria-hidden="true" />
            )}
            <span>Passwords match</span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

