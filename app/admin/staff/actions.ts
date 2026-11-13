"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateStaffProfile(formData: FormData) {
  const parsed = z.object({ id: z.string().uuid(), display_name: z.string().trim().min(2).max(120), role: z.enum(["reporter", "editor", "admin"]), is_active: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/staff?error=invalid");
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { error } = await supabase.rpc("admin_update_staff_profile", { target_id: parsed.data.id, new_display_name: parsed.data.display_name, new_role: parsed.data.role, new_is_active: parsed.data.is_active === "true" });
  if (error) redirect("/admin/staff?error=not-authorized");
  revalidatePath("/admin/staff"); revalidatePath("/admin"); redirect("/admin/staff?saved=1");
}
