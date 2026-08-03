import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be 32 characters or fewer.")
  .regex(
    /^[a-z0-9_]+$/,
    "Use lowercase letters, numbers, and underscores only.",
  );

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(80),
  username: usernameSchema,
  avatarUrl: z.string().trim().url("Enter a valid avatar URL.").or(z.literal("")),
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer."),
  city: z.string().trim().max(80),
  state: z.string().trim().max(40),
});

export function parseFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function passwordStrengthLabel(password: string) {
  if (password.length >= 12 && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    return "strong";
  }

  if (password.length >= 8) {
    return "usable";
  }

  return "too_short";
}
