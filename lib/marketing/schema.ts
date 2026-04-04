export type MarketingLocale = "ar" | "en";

export type OrganizationJsonLd = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
};

export type WebSiteJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  inLanguage?: string;
};

export type SoftwareApplicationJsonLd = {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  applicationCategory: string;
  operatingSystem: string;
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
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Taqam",
    url: opts.url,
    logo: `${opts.url}/opengraph-image`,
  };
}

export function websiteSchema(opts: { url: string; locale: MarketingLocale }): WebSiteJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Taqam",
    url: opts.url,
    inLanguage: opts.locale === "ar" ? "ar-SA" : "en-US",
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
  const hasRating = typeof ratingValue === "number" && typeof ratingCount === "number" && ratingCount > 0;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Taqam",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      priceCurrency: "SAR",
      url: opts.pricingUrl,
    },
    ...(hasRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue,
            ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
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
        text: f.a,
      },
    })),
  };
}
