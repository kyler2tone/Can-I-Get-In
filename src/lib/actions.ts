"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  completeProfileSchema,
  emailSchema,
  parseFormString,
  passwordSchema,
  profileSchema,
  signupSchema,
  usernameSchema,
} from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getAuthCallbackUrl } from "@/lib/auth-urls";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultError = "Something went wrong. Please try again.";

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
  const parsed = signupSchema.safeParse({
    email: parseFormString(formData, "email"),
    password: parseFormString(formData, "password"),
    confirmPassword: parseFormString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/onboarding/profile"),
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
    redirectTo: getAuthCallbackUrl("/auth/reset-password"),
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

  return { status: "success", message: "Profile updated." };
}

export async function completeProfileAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = completeProfileSchema.safeParse({
    displayName: parseFormString(formData, "displayName"),
    username: parseFormString(formData, "username"),
  });
  const next = parseFormString(formData, "next") || "/dashboard";

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("complete_profile", {
    candidate_username: parsed.data.username,
    candidate_display_name: parsed.data.displayName,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function changeUsernameAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const username = usernameSchema.safeParse(parseFormString(formData, "username"));
  const confirmation = parseFormString(formData, "confirmation");

  if (!username.success) {
    return { status: "error", message: username.error.issues[0].message };
  }

  if (confirmation !== "CHANGE") {
    return { status: "error", message: "Type CHANGE to confirm your new public profile URL." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("change_username", {
    candidate_username: username.data,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/settings/account");
  revalidatePath(`/contributors/${username.data}`);
  revalidatePath(`/contributors/${user.id}`);

  return { status: "success", message: "Username updated." };
}

export async function changeEmailAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const email = emailSchema.safeParse(parseFormString(formData, "email"));

  if (!email.success) {
    return { status: "error", message: email.error.issues[0].message };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.updateUser(
    { email: email.data },
    { emailRedirectTo: getAuthCallbackUrl("/settings/account") },
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message: "Check the new email address for a confirmation link.",
  };
}

export async function sendMagicLinkAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = emailSchema.safeParse(parseFormString(formData, "email"));

  if (!email.success) {
    return { status: "error", message: email.error.issues[0].message };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/dashboard"),
      shouldCreateUser: false,
    },
  });

  if (error) {
    return {
      status: "success",
      message: "If that email can sign in, a link is on the way.",
    };
  }

  return { status: "success", message: "If that email can sign in, a link is on the way." };
}

export async function signInWithGoogleAction() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl("/onboarding/profile"),
    },
  });

  if (error || !data.url) {
    redirect("/auth/login?message=Google sign-in could not be started.");
  }

  redirect(data.url);
}

export async function deleteAccountAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const confirmation = parseFormString(formData, "confirmation");

  if (confirmation !== "DELETE") {
    return { status: "error", message: "Type DELETE to confirm account deletion." };
  }

  const admin = getSupabaseAdminClient();

  await admin
    .from("profiles")
    .update({
      display_name: "Former Contributor",
      username: `deleted-${user.id.slice(0, 8)}`,
      avatar_url: null,
      bio: null,
      city: null,
      state: null,
      profile_completed: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id, true);

  if (error) {
    return { status: "error", message: error.message };
  }

  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/?message=Your account has been deleted.");
}
