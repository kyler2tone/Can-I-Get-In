"use client";

import { useActionState } from "react";
import { changeUsernameAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { UsernameField } from "@/components/account/username-field";

const initialState: ActionState = { status: "idle", message: "" };

export function ChangeUsernameForm({ currentUsername }: { currentUsername: string }) {
  const [state, action, pending] = useActionState(changeUsernameAction, initialState);

  return (
    <form action={action} className="space-y-4 border border-line bg-white p-4">
      <div>
        <h3 className="font-semibold">Change username</h3>
        <p className="mt-1 text-sm text-muted">
          Your username controls your public profile URL. Redirects from old usernames are
          recorded in the database, but public redirect pages are deferred.
        </p>
      </div>
      <UsernameField defaultValue={currentUsername} />
      <label className="block text-sm font-medium">
        Type CHANGE to confirm
        <input
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
          name="confirmation"
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
      <Button disabled={pending} variant="secondary">
        {pending ? "Saving..." : "Save username change"}
      </Button>
    </form>
  );
}
