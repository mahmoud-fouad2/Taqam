import Providers from "@/components/providers";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { getSiteUrl } from "@/lib/marketing/site";
import { getAppLocale } from "@/lib/i18n/locale";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Taqam | طاقم",
    template: "%s | Taqam",
  },
};

const ibmPlexSansArabic = localFont({
  variable: "--font-taqam-sans",
  display: "swap",
  fallback: ["sans-serif"],
  src: [
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getAppLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${ibmPlexSansArabic.variable} font-sans`}>
        <Providers dir={dir}>{children}</Providers>
      </body>
    </html>
  );
}
