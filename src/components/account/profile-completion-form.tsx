"use client";

import { useActionState } from "react";
import { completeProfileAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { UsernameField } from "@/components/account/username-field";

const initialState: ActionState = { status: "idle", message: "" };

export function ProfileCompletionForm({
  next,
  displayName,
}: {
  next: string;
  displayName: string;
}) {
  const [state, action, pending] = useActionState(completeProfileAction, initialState);

  return (
    <form action={action} className="space-y-5 border border-line bg-surface p-5">
      <input name="next" type="hidden" value={next} />
      <label className="block text-sm font-medium">
        Display name
        <input
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
          name="displayName"
          defaultValue={displayName}
          required
        />
      </label>
      <UsernameField />
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
      <Button disabled={pending}>{pending ? "Saving..." : "Complete profile"}</Button>
    </form>
  );
}
