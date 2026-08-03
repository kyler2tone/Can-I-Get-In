"use client";

import { useActionState } from "react";
import { updateProfileAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionState = { status: "idle", message: "" };

type Profile = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
};

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="space-y-5 border border-line bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Display name
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
            name="displayName"
            defaultValue={profile?.display_name ?? ""}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Username
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
            name="username"
            defaultValue={profile?.username ?? ""}
            pattern="[a-z0-9_]+"
            required
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Avatar URL
        <input
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
          name="avatarUrl"
          defaultValue={profile?.avatar_url ?? ""}
          type="url"
        />
      </label>
      <label className="block text-sm font-medium">
        Bio
        <textarea
          className="mt-1 min-h-28 w-full rounded-md border border-line bg-white px-3 py-2"
          name="bio"
          defaultValue={profile?.bio ?? ""}
          maxLength={280}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          City
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
            name="city"
            defaultValue={profile?.city ?? ""}
          />
        </label>
        <label className="block text-sm font-medium">
          State
          <input
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
            name="state"
            defaultValue={profile?.state ?? ""}
          />
        </label>
      </div>
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
      <Button disabled={pending}>{pending ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}
