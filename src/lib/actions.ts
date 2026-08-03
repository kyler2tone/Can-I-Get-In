"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { emailSchema, parseFormString, passwordSchema, profileSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultError = "Something went wrong. Please try again.";

function originFromHeaders() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(parseFormString(formData, "email"));
  const password = passwordSchema.safeParse(parseFormString(formData, "password"));

  if (!email.success) return { status: "error", message: email.error.issues[0].message };
  if (!password.success) return { status: "error", message: password.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect("/dashboard");
}

export async function signupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(parseFormString(formData, "email"));
  const password = passwordSchema.safeParse(parseFormString(formData, "password"));

  if (!email.success) return { status: "error", message: email.error.issues[0].message };
  if (!password.success) return { status: "error", message: password.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      emailRedirectTo: `${originFromHeaders()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message: "Check your email to verify your account, then you can sign in.",
  };
}

export async function forgotPasswordAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = emailSchema.safeParse(parseFormString(formData, "email"));

  if (!email.success) return { status: "error", message: email.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${originFromHeaders()}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message: "If that email has an account, a reset link is on the way.",
  };
}

export async function resetPasswordAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = passwordSchema.safeParse(parseFormString(formData, "password"));

  if (!password.success) return { status: "error", message: password.error.issues[0].message };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", message: "Your password has been updated." };
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfileAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    displayName: parseFormString(formData, "displayName"),
    username: parseFormString(formData, "username"),
    avatarUrl: parseFormString(formData, "avatarUrl"),
    bio: parseFormString(formData, "bio"),
    city: parseFormString(formData, "city"),
    state: parseFormString(formData, "state"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      username: parsed.data.username,
      avatar_url: parsed.data.avatarUrl || null,
      bio: parsed.data.bio || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
    })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: error.message || defaultError };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/profile");
  revalidatePath(`/contributors/${parsed.data.username}`);

  return { status: "success", message: "Profile updated." };
}
