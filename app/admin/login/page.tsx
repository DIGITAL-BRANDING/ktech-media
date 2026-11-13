import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Shiga newsroom" };

export default async function AdminLoginPage() {
  if (!isSupabaseConfigured()) return <section className="section"><div className="container admin-gate"><h1>Newsroom login</h1><p>Da farko saka bayanan Supabase a .env.local.</p></div></section>;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/admin");
  return <section className="section"><div className="container admin-gate"><span className="eyebrow">NEWSROOM</span><h1>Shiga newsroom</h1><p>Yi amfani da email da kalmar sirrin asusun newsroom ɗinka.</p><LoginForm /></div></section>;
}
