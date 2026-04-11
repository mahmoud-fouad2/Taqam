export type MarketingLocale = "ar" | "en";

export type OrganizationJsonLd = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
};

export type WebSiteJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  inLanguage?: string;
};

export type SoftwareApplicationJsonLd = {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  url?: string;
  description?: string;
  applicationCategory: string;
  operatingSystem: string;
  availableLanguage?: string[];
  offers?: {
    "@type": "Offer";
    priceCurrency: string;
    price?: string;
    url?: string;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    ratingCount: number;
    bestRating?: number;
    worstRating?: number;
  };
};

export type FaqPageJsonLd = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
};

export function organizationSchema(opts: { url: string }): OrganizationJsonLd {
  const sameAs = (process.env.NEXT_PUBLIC_ORGANIZATION_SAME_AS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Taqam",
    url: opts.url,
    logo: `${opts.url}/icons/logo-navbar-light-1200.png`,
    description: "Saudi HR, payroll, attendance, and workforce operations platform.",
    ...(sameAs.length > 0 ? { sameAs } : {})
  };
}

export function websiteSchema(opts: { url: string; locale: MarketingLocale }): WebSiteJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Taqam",
    url: opts.url,
    description:
      "Taqam is a bilingual Saudi HR platform for payroll, attendance, and employee operations.",
    inLanguage: opts.locale === "ar" ? "ar-SA" : "en-US"
  };
}

/**
 * IMPORTANT: We intentionally do NOT hardcode a 5-star rating.
 * If you have real rating data, set NEXT_PUBLIC_RATING_VALUE and NEXT_PUBLIC_RATING_COUNT.
 */
export function softwareAppSchema(opts: {
  url: string;
  pricingUrl?: string;
  ratingValue?: number;
  ratingCount?: number;
}): SoftwareApplicationJsonLd {
  const ratingValue = typeof opts.ratingValue === "number" ? opts.ratingValue : undefined;
  const ratingCount = typeof opts.ratingCount === "number" ? opts.ratingCount : undefined;
  const hasRating =
    typeof ratingValue === "number" && typeof ratingCount === "number" && ratingCount > 0;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Taqam",
    url: opts.url,
    description:
      "HR, payroll, attendance, leave, and workforce operations platform built for Saudi Arabia.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    availableLanguage: ["ar", "en"],
    offers: {
      "@type": "Offer",
      priceCurrency: "SAR",
      url: opts.pricingUrl
    },
    ...(hasRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue,
            ratingCount,
            bestRating: 5,
            worstRating: 1
          }
        }
      : {})
  };
}

export function faqSchema(faqs: Array<{ q: string; a: string }>): FaqPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a
      }
    }))
  };
}
