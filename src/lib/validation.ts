import { z } from "zod";
import { getPasswordPolicyMessage } from "@/lib/password-policy";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.");

export const passwordSchema = z
  .string()
  .max(128, "Password is too long.")
  .superRefine((value, context) => {
    const message = getPasswordPolicyMessage(value);
    if (message) {
      context.addIssue({ code: "custom", message });
    }
  });

export const reservedUsernames = new Set([
  "admin",
  "administrator",
  "moderator",
  "support",
  "api",
  "auth",
  "login",
  "signup",
  "settings",
  "dashboard",
  "contribute",
  "contributors",
  "places",
  "map",
  "canigetin",
]);

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export const usernameSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeUsername(value) : value),
  z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be 32 characters or fewer.")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username must contain only lowercase letters, numbers, hyphens, and underscores.",
    )
    .refine((value: string) => !reservedUsernames.has(value), {
      message: "That username is reserved. Choose another one.",
    }),
);

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required.")
  .max(80, "Display name must be 80 characters or fewer.");

export const profileSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: z.string().trim().url("Upload an avatar or leave it blank.").or(z.literal("")),
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer."),
  city: z.string().trim().max(80),
  state: z.string().trim().max(40),
});

export const completeProfileSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const passwordWithConfirmationSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export function parseFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function passwordStrengthLabel(password: string) {
  if (!getPasswordPolicyMessage(password)) {
    return "strong";
  }

  if (password.length >= 8) {
    return "usable";
  }

  return "too_short";
}
