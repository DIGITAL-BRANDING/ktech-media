import "server-only";

import { z } from "zod";

const publicSupabaseEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export function isSupabaseConfigured(): boolean {
  return publicSupabaseEnv.safeParse(process.env).success;
}

export function getSupabasePublicEnv() {
  const result = publicSupabaseEnv.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add the project URL and publishable key.",
    );
  }
  return result.data;
}
