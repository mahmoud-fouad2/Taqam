export type MarketingLocale = "ar" | "en";

export function getSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && /^https?:\/\//.test(env)) return env.replace(/\/$/, "");
  return "https://taqam.net";
}

export function getMarketingLocaleFromCookie(
  cookieValue: string | undefined | null
): MarketingLocale {
  return cookieValue === "en" ? "en" : "ar";
}
