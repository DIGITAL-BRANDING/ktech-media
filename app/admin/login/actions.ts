"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function loginWithPassword(_state: LoginState, formData: FormData): Promise<LoginState> {
  const credentials = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }).safeParse({ email: formData.get("email"), password: formData.get("password") });

  if (!credentials.success) return { error: "Shigar da email da kalmar sirri mai inganci." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) {
    console.warn("Newsroom sign-in rejected:", error.code || "auth_error");
    return { error: "Ba a iya shiga da bayanan nan ba." };
  }

  redirect("/admin");
}
