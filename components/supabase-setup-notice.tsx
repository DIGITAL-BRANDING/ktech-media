import Link from "next/link";

export function SupabaseSetupNotice({ title = "A haɗa Supabase tukuna" }: { title?: string }) {
  return <section className="section"><div className="container admin-gate"><span className="eyebrow">SUPABASE</span><h1>{title}</h1><p>Kwafi <code>.env.example</code> zuwa <code>.env.local</code>, saka Supabase Project URL da publishable key, sannan a kunna migration ɗin database.</p><Link href="/" className="btn-waraka-primary">Komawa gida</Link></div></section>;
}
