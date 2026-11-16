import { cookies } from "next/headers";

export type Locale = "en" | "ha";

const messages = {
  en: {
    home: "Home", news: "News", allNews: "All news", programs: "Programs", videos: "Videos", photos: "Photos", awards: "Awards", about: "About", advertise: "Advertise", contact: "Contact", watchLive: "Watch Live", listenLive: "Listen Live", radio: "Radio", podcasts: "Podcasts", search: "Search", breaking: "BREAKING", quickLinks: "QUICK LINKS", newsTopics: "NEWS TOPICS", getInTouch: "GET IN TOUCH", aboutUs: "About Us", newsroomEmail: "Newsroom email", advertisingInquiries: "Advertising inquiries", liveTv: "Live TV", privacy: "Privacy Policy", terms: "Terms of Use", allRightsReserved: "All Rights Reserved.", subscribe: "Subscribe", subscribeNewsletter: "Get the latest stories in your inbox", emailAddress: "Email address", confirmSubscription: "Subscribe", listenNow: "Listen now", latestEpisodes: "Latest episodes", sponsored: "Sponsored", language: "Language", english: "English", hausa: "Hausa", noSpam: "No spam. Unsubscribe at any time.",
  },
  ha: {
    home: "Gida", news: "Labarai", allNews: "Dukkan labarai", programs: "Shirye-shirye", videos: "Bidiyo", photos: "Hotuna", awards: "Kyaututtuka", about: "Game da mu", advertise: "Tallace-tallace", contact: "Tuntuɓe mu", watchLive: "Kalli kai tsaye", listenLive: "Saurara kai tsaye", radio: "Rediyo", podcasts: "Podkast", search: "Bincika", breaking: "LABARI MAI ZAFI", quickLinks: "HANYOYI MASU SAURI", newsTopics: "BATUTUWAN LABARAI", getInTouch: "TUNTUƁE MU", aboutUs: "Game da mu", newsroomEmail: "Imel ɗin newsroom", advertisingInquiries: "Tambayoyin talla", liveTv: "Talabijin kai tsaye", privacy: "Manufar sirri", terms: "Sharuɗɗan amfani", allRightsReserved: "An kiyaye duk haƙƙoƙi.", subscribe: "Yi rajista", subscribeNewsletter: "Samu sabbin labarai ta imel", emailAddress: "Adireshin imel", confirmSubscription: "Yi rajista", listenNow: "Saurara yanzu", latestEpisodes: "Sabbin shirye-shirye", sponsored: "Tallafi ne", language: "Harshe", english: "Turanci", hausa: "Hausa", noSpam: "Ba za mu cika akwatin imel ɗinka da saƙonni ba. Za ka iya cire rajista a kowane lokaci.",
  },
} as const;

export type MessageKey = keyof typeof messages.en;

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}

const categoriesEn: Record<string, string> = { politics: "Politics", business: "Business", sports: "Sports", entertainment: "Entertainment", education: "Education", health: "Health", technology: "Technology", international: "International" };
export function categoryName(locale: Locale, slug: string, fallback: string) {
  return locale === "en" ? categoriesEn[slug] || fallback : fallback;
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get("site_locale")?.value === "ha" ? "ha" : "en";
}
