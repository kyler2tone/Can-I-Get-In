"use client";

import { useActionState, useRef, useState } from "react";
import {
  changeEmailAction,
  updateAccountPasswordAction,
  type ActionState,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordPolicyChecklist } from "@/components/auth/password-policy-checklist";
import { validatePasswordPolicy } from "@/lib/password-policy";

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
  const [state, action, pending] = useActionState(updateAccountPasswordAction, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordResult = validatePasswordPolicy(password, confirmPassword);
  const canSubmit = password.length > 0 && confirmPassword.length > 0 && passwordResult.valid;

  return (
    <form action={action} className="space-y-4 border border-line bg-white p-4">
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
      <Message state={state} />
      <Button disabled={pending || !canSubmit} variant="secondary">
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

export function DeleteAccountForm({ error }: { error?: string }) {
  const submittedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <form
      action="/settings/account/delete"
      className="space-y-4 border border-rose-200 bg-rose-50 p-4"
      method="post"
      onSubmit={(event) => {
        if (submittedRef.current) {
          event.preventDefault();
          return;
        }

        if (!window.confirm("Delete your Can I Get In? account? This cannot be undone.")) {
          event.preventDefault();
          return;
        }

        submittedRef.current = true;
        if (buttonRef.current) {
          buttonRef.current.disabled = true;
          buttonRef.current.textContent = "Deleting...";
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
      {error ? (
        <p className="rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-950" role="alert">
          {error}
        </p>
      ) : null}
      <Button ref={buttonRef} variant="secondary">
        Delete my account
      </Button>
    </form>
  );
}

export function ExportDataButton() {
  const className =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition";

  return (
    <div className="flex flex-wrap gap-2">
      <a className={`${className} border-brand bg-brand text-white hover:bg-brand-strong`} download href="/settings/account/export">
        Download JSON
      </a>
      <a
        className={`${className} border-line bg-surface text-foreground hover:border-brand hover:text-brand-strong`}
        download
        href="/settings/account/export?format=txt"
      >
        Download TXT
      </a>
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
