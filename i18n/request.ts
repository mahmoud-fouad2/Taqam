import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

// Supported locales
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "ar";

// Get locale from cookie or return default
export async function getLocale(): Promise<Locale> {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-taqam-locale");
  if (headerLocale && locales.includes(headerLocale as Locale)) {
    return headerLocale as Locale;
  }

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("taqam_locale")?.value;

  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }

  return defaultLocale;
}

// next-intl configuration
export default getRequestConfig(async () => {
  const locale = await getLocale();

  // Validate that the incoming locale is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
