"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({ name: z.string().trim().min(1).max(80), description: z.string().trim().max(500), color: z.string().regex(/^#[\da-fA-F]{6}$/), sort_order: z.coerce.number().int().min(0).max(999) });
function slugify(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export async function createCategory(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/categories?error=check-fields");
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { error } = await supabase.from("categories").insert({ ...parsed.data, slug: slugify(parsed.data.name), created_by: claims.claims.sub });
  if (error) redirect(`/admin/categories?error=${error.code === "23505" ? "duplicate" : "save-failed"}`);
  revalidatePath("/admin/categories"); revalidatePath("/admin/articles/new"); redirect("/admin/categories?saved=1");
}
export async function toggleCategory(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const active = z.enum(["true", "false"]).safeParse(formData.get("active"));
  if (!id.success || !active.success) redirect("/admin/categories?error=invalid");
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { error } = await supabase.from("categories").update({ is_active: active.data === "true" }).eq("id", id.data);
  if (error) redirect("/admin/categories?error=save-failed");
  revalidatePath("/admin/categories"); revalidatePath("/"); redirect("/admin/categories?saved=1");
}
