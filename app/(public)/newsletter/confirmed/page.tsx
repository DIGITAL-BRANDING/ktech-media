import Link from "next/link";
import { getLocale } from "@/lib/i18n";

type Props = { searchParams: Promise<{ status?: string }> };
export default async function NewsletterConfirmedPage({ searchParams }: Props) {
  const [{ status }, locale] = await Promise.all([searchParams, getLocale()]);
  const message = locale === "ha"
    ? status === "success" ? "An tabbatar da rajistar imel ɗinka. Mun gode." : status === "unsubscribed" ? "An cire imel ɗinka daga rajista." : "Wannan hanyar ba ta aiki ko an riga an yi amfani da ita."
    : status === "success" ? "Your subscription is confirmed. Thank you." : status === "unsubscribed" ? "Your email has been unsubscribed." : "This link is invalid or has already been used.";
  return <section className="section"><div className="container page-intro"><span className="eyebrow">NEWSLETTER</span><h1>{message}</h1><p><Link href="/">{locale === "ha" ? "Koma shafin farko" : "Return to the homepage"}</Link></p></div></section>;
}
