"use client";

import { useActionState, useRef } from "react";
import {
  changeEmailAction,
  deleteAccountAction,
  resetPasswordAction,
  type ActionState,
} from "@/lib/actions";
import { canStartAccountDeletion } from "@/lib/account-deletion";
import { Button, ButtonLink } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";

const initialState: ActionState = { status: "idle", message: "" };

export function ChangeEmailForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(changeEmailAction, initialState);

  return (
    <form action={action} className="space-y-4 border border-line bg-white p-4">
      <p className="text-sm text-muted">Current login email: {email}</p>
      <label className="block text-sm font-medium">
        New email
        <input
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <Message state={state} />
      <Button disabled={pending} variant="secondary">
        {pending ? "Sending..." : "Send email change confirmation"}
      </Button>
    </form>
  );
}

export function PasswordUpdateForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={action} className="space-y-4 border border-line bg-white p-4">
      <PasswordField label="New password" name="password" autoComplete="new-password" />
      <Message state={state} />
      <Button disabled={pending} variant="secondary">
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, initialState);
  const submittedRef = useRef(false);

  return (
    <form
      action={async (formData) => {
        if (!canStartAccountDeletion({ pending, submitted: submittedRef.current })) return;
        submittedRef.current = true;
        try {
          await action(formData);
        } finally {
          submittedRef.current = false;
        }
      }}
      className="space-y-4 border border-rose-200 bg-rose-50 p-4"
      onSubmit={(event) => {
        if (!window.confirm("Delete your Can I Get In? account? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <p className="text-sm leading-6 text-rose-950">
        Deleting your account removes your login, public profile, display name, username,
        avatar, and bio. Community accessibility records and uploaded photo metadata are
        retained with the Contributor identity removed.
      </p>
      <label className="block text-sm font-medium text-rose-950">
        Type DELETE to confirm
        <input
          className="mt-1 w-full rounded-md border border-rose-200 bg-white px-3 py-2"
          name="confirmation"
          required
        />
      </label>
      <Message state={state} />
      <Button disabled={pending} variant="secondary">
        {pending ? "Deleting..." : "Delete my account"}
      </Button>
    </form>
  );
}

export function ExportDataButton() {
  return (
    <div className="flex flex-wrap gap-2">
      <ButtonLink href="/settings/account/export">Download JSON</ButtonLink>
      <ButtonLink href="/settings/account/export?format=txt" variant="secondary">
        Download TXT
      </ButtonLink>
    </div>
  );
}

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;

  return (
    <p
      className={`rounded-md px-3 py-2 text-sm ${
        state.status === "success" ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-950"
      }`}
    >
      {state.message}
    </p>
  );
}
