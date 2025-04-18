"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchUser } from "@/utils/fetchUser";

export const signUpAction = async (formData: FormData) => {
  const username = formData.get("username")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const isLecturer: boolean = formData.get("isLecturer")?.toString() === "on";
  console.log(
    "[SIGNUP] isLecturer raw value:",
    isLecturer,
    isLecturer ? "lecturer" : "student",
  );
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!username || !email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Username, email and password are required",
    );
  }

  const { data: existingUser, error: err } = await supabase
    .from("users")
    .select("user_id")
    .eq("username", username)
    .maybeSingle(); // ✅ safer than .single() if you're unsure

  if (err) {
    console.error();
    return encodedRedirect(
      "error",
      "/sign-up",
      "❌ Supabase error checking username:" + err.message,
    );
  } else if (existingUser) {
    return encodedRedirect("error", "/sign-up", "Username is already taken");
  }

  const { data } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl("default.jpg");

  const publicUrl = data.publicUrl;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        username,
        email,
        role: isLecturer ? "lecturer" : "student",
        pfp_url: publicUrl,
      },
    },
  });

  if (error) {
    console.error(error.code + " womp womp " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-in",
      `Thanks for signing up ${username}, you may login now`,
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
