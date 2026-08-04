"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";

const initialState: ActionState = { status: "idle", message: "" };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={action} className="mx-auto max-w-md space-y-4 border border-line bg-surface p-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="text-sm text-muted">Choose a new password for your account.</p>
      <PasswordField label="New password" name="password" autoComplete="new-password" />
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
      <Button className="w-full" disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
