import { Button } from "@/components/ui/button";
import { UsernameField } from "@/components/account/username-field";

export function ProfileCompletionForm({
  next,
  displayName,
  error,
}: {
  next: string;
  displayName: string;
  error?: string;
}) {
  return (
    <form
      action="/onboarding/profile/complete"
      method="post"
      className="space-y-5 border border-line bg-surface p-5"
    >
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
      {error ? (
        <p className="rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-950" role="alert">
          {error}
        </p>
      ) : null}
      <Button>Complete profile</Button>
    </form>
  );
}
