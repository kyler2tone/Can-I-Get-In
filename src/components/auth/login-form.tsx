"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  sendMagicLinkAction,
  signInWithGoogleAction,
  type ActionState,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";

const initialState: ActionState = { status: "idle", message: "" };

export function LoginForm() {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    loginAction,
    initialState,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    sendMagicLinkAction,
    initialState,
  );

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="space-y-6 border border-line bg-surface p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="mt-2 text-sm text-muted">Access your Contributor dashboard.</p>
        </div>
        <form action={signInWithGoogleAction}>
          <Button className="w-full" type="submit" variant="secondary">
            Continue with Google
          </Button>
        </form>
        <form action={passwordAction} className="space-y-4">
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
          <PasswordField label="Password" name="password" autoComplete="current-password" />
          {passwordState.message ? <AuthMessage state={passwordState} /> : null}
          <Button className="w-full" disabled={passwordPending}>
            {passwordPending ? "Working..." : "Log in"}
          </Button>
        </form>
        <form action={magicAction} className="space-y-4 border-t border-line pt-5">
          <label className="block text-sm font-medium">
            Email me a sign-in link
            <input
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          {magicState.message ? <AuthMessage state={magicState} /> : null}
          <Button className="w-full" disabled={magicPending} type="submit" variant="secondary">
            {magicPending ? "Sending..." : "Continue with Email Link"}
          </Button>
        </form>
        <p className="text-sm text-muted">
          New here?{" "}
          <Link className="font-semibold text-brand-strong underline" href="/auth/signup">
            Create an account
          </Link>
          . Forgot your password?{" "}
          <Link className="font-semibold text-brand-strong underline" href="/auth/forgot-password">
            Reset it
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function AuthMessage({ state }: { state: ActionState }) {
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
