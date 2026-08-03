"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionState = { status: "idle", message: "" };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={action} className="mx-auto max-w-md space-y-4 border border-line bg-surface p-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="text-sm text-muted">Choose a new password for your account.</p>
      <label className="block text-sm font-medium">
        New password
        <input
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
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
