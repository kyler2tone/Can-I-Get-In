"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { signInWithGoogleAction, signupAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";

const initialState: ActionState = { status: "idle", message: "" };

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordHelp = useMemo(
    () => "Use at least 8 characters. Your browser or password manager can suggest a strong password.",
    [],
  );

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="space-y-6 border border-line bg-surface p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Create a Contributor account</h1>
          <p className="mt-2 text-sm text-muted">
            Register with email and password. You will verify your email before contributing.
          </p>
        </div>
        <form action={signInWithGoogleAction}>
          <Button className="w-full" type="submit" variant="secondary">
            Continue with Google
          </Button>
        </form>
        <form action={action} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <div onChange={(event) => {
            const target = event.target as HTMLInputElement;
            if (target.name === "password") setPassword(target.value);
            if (target.name === "confirmPassword") setConfirmPassword(target.value);
          }}>
            <PasswordField label="Password" name="password" autoComplete="new-password" />
            <p className="mt-1 text-xs text-muted">{passwordHelp}</p>
            <div className="mt-4">
              <PasswordField
                label="Confirm password"
                name="confirmPassword"
                autoComplete="new-password"
              />
            </div>
          </div>
          {mismatch ? (
            <p className="rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-950" role="alert">
              Passwords do not match.
            </p>
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
          <Button className="w-full" disabled={pending || mismatch}>
            {pending ? "Working..." : "Sign up"}
          </Button>
        </form>
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link className="font-semibold text-brand-strong underline" href="/auth/login">
            Log in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
