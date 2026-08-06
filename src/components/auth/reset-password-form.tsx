"use client";

import { useActionState, useEffect, useState } from "react";
import { resetPasswordAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordPolicyChecklist } from "@/components/auth/password-policy-checklist";
import { validatePasswordPolicy } from "@/lib/password-policy";

export function ResetPasswordForm({
  canResetPassword,
  initialError,
}: {
  canResetPassword: boolean;
  initialError?: string;
}) {
  const [state, action, pending] = useActionState(resetPasswordAction, {
    status: initialError ? "error" : "idle",
    message: initialError ?? "",
  } satisfies ActionState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordResult = validatePasswordPolicy(password, confirmPassword);
  const canSubmit = password.length > 0 && confirmPassword.length > 0 && passwordResult.valid;

  useEffect(() => {
    if (state.status !== "success") return;

    const timeout = window.setTimeout(() => {
      window.location.assign("/dashboard");
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [state.status]);

  return (
    <form action={action} className="mx-auto max-w-md space-y-4 border border-line bg-surface p-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="text-sm text-muted">Choose a new password for your account.</p>
      {canResetPassword ? (
        <div
          className="space-y-4"
          onChange={(event) => {
            const target = event.target as HTMLInputElement;
            if (target.name === "password") setPassword(target.value);
            if (target.name === "confirmPassword") setConfirmPassword(target.value);
          }}
        >
          <PasswordField label="New password" name="password" autoComplete="new-password" />
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
          />
          <PasswordPolicyChecklist
            confirmation={confirmPassword}
            password={password}
            showConfirmation={confirmPassword.length > 0}
          />
        </div>
      ) : null}
      {state.message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            state.status === "success"
              ? "bg-emerald-100 text-emerald-900"
              : "bg-rose-100 text-rose-950"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      {canResetPassword ? (
        <Button className="w-full" disabled={pending || !canSubmit}>
          {pending ? "Updating..." : "Update password"}
        </Button>
      ) : (
        <ButtonLink className="w-full" href="/auth/forgot-password">
          Request a new reset email
        </ButtonLink>
      )}
    </form>
  );
}
