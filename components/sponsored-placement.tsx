import Image from "next/image";
import { getActiveAd, type AdSlot } from "@/lib/ads";
import { getLocale, t } from "@/lib/i18n";

export async function SponsoredPlacement({ slot, className = "" }: { slot: AdSlot; className?: string }) {
  const [ad, locale] = await Promise.all([getActiveAd(slot), getLocale()]);
  if (!ad) return null;
  return <aside className={`sponsored-placement ${className}`} aria-label={locale === "ha" ? "Tallace-tallace da aka ɗauki nauyi" : "Sponsored content"}>
    <span className="sponsored-label">{t(locale, "sponsored")}</span>
    <a href={ad.destination_url} target="_blank" rel="sponsored noopener noreferrer"><Image src={ad.image_url} alt={ad.title} width={900} height={300} unoptimized /><span className="sponsored-copy"><strong>{ad.title}</strong>{ad.description && <small>{ad.description}</small>}<small>{ad.advertiser}</small></span></a>
  </aside>;
}
