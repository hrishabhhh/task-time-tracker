"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

function parseCredentials(formData: FormData) {
  return authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(formData: FormData) {
  const result = parseCredentials(formData);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid form data";

    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const result = parseCredentials(formData);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid form data";

    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  redirect(
    `/signup?error=${encodeURIComponent(
      "Account created, but sign in could not be completed",
    )}`,
  );
}
