export const passwordRecoveryIntentCookie = "cigi-password-recovery";
export const passwordRecoveryIntentValue = "1";
export const passwordRecoveryIntentMaxAge = 15 * 60;

export function isPasswordRecoveryIntent(value: string | null | undefined) {
  return value === "recovery";
}

