export function canStartAccountDeletion({
  pending,
  submitted,
}: {
  pending: boolean;
  submitted: boolean;
}) {
  return !pending && !submitted;
}

