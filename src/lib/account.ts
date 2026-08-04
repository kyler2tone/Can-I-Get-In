export type ProfileCompletionState = {
  profile_completed?: boolean | null;
};

export function canContributePhotos(profile: ProfileCompletionState | null | undefined) {
  return profile?.profile_completed === true;
}
