import { redirect } from "next/navigation";
import { PhotoStoryForm } from "@/components/photo-story-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

export const metadata = { title: "Sabon photo story" };
export const dynamic = "force-dynamic";

export default async function NewPhotoStoryPage() {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Haɗa Supabase domin wallafa hotuna" />;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data: categories } = await supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order");
  return <section className="section"><div className="container admin-gate"><span className="eyebrow">NEWSROOM • PHOTO STORY</span><h1>Ƙirƙiri photo story</h1><p>Za a aika da photo story zuwa ga jerin dubawa kafin ya bayyana a shafin jama’a.</p><PhotoStoryForm categories={categories ?? []} /></div></section>;
}
