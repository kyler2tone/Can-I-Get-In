"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";

type AuthFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  showPassword?: boolean;
  footer?: React.ReactNode;
};

const initialState: ActionState = { status: "idle", message: "" };

export function AuthForm({
  title,
  description,
  submitLabel,
  action,
  showPassword = true,
  footer,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <form action={formAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </label>
          {showPassword ? (
            <label className="block text-sm font-medium">
              Password
              <input
                className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
              />
            </label>
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
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Working..." : submitLabel}
          </Button>
        </form>
        {footer ? <div className="mt-5 text-sm text-muted">{footer}</div> : null}
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Community observations are informational and may be incomplete.
      </p>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="font-semibold text-brand-strong underline" href={href}>
      {children}
    </Link>
  );
}
