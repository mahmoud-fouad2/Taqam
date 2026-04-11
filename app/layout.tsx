import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import Providers from "@/components/providers";
import { getAppLocale } from "@/lib/i18n/locale";
import { getPlatformSiteContent } from "@/lib/marketing/site-content";
import { getSiteUrl } from "@/lib/marketing/site";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const siteContent = await getPlatformSiteContent();
  const title = `${siteContent.siteNameEn} | ${siteContent.siteNameAr}`;

  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: siteContent.siteNameEn,
    title: {
      default: title,
      template: `%s | ${siteContent.siteNameEn}`
    },
    description: siteContent.defaultDescriptionEn,
    manifest: "/manifest.webmanifest",
    verification: {
      google: "googlec1df282af5d25af4"
    },
    icons: {
      icon: [
        { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
        { url: "/icons/taqam-icon.svg", type: "image/svg+xml" }
      ],
      apple: [{ url: "/icons/mark-light-256.png", sizes: "256x256" }],
      shortcut: "/icons/favicon-32.png"
    },
    openGraph: {
      type: "website",
      siteName: siteContent.siteNameEn,
      title,
      description: siteContent.defaultDescriptionEn,
      images: [
        {
          url: "/opengraph-image",
          alt: siteContent.siteNameEn
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: siteContent.defaultDescriptionEn,
      images: ["/twitter-image"]
    },
    other: {
      "mobile-web-app-capable": "yes"
    },
    authors: [{ name: siteContent.siteNameEn }],
    creator: siteContent.siteNameEn
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" }
  ]
};

const ibmPlexSansArabic = localFont({
  variable: "--font-taqam-sans",
  display: "swap",
  fallback: ["sans-serif"],
  src: [
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-400-normal.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-500-normal.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-600-normal.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-700-normal.woff2",
      weight: "700",
      style: "normal"
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-400-normal.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-500-normal.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-600-normal.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "./fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-700-normal.woff2",
      weight: "700",
      style: "normal"
    }
  ]
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
        <Providers dir={dir} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}