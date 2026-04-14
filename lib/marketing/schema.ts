export type MarketingLocale = "ar" | "en";

export type OrganizationJsonLd = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  alternateName?: string;
  sameAs?: string[];
};

export type WebSiteJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  "@id"?: string;
  name: string;
  url: string;
  description?: string;
  inLanguage?: string;
  alternateName?: string;
  publisher?: {
    "@type": "Organization";
    name: string;
    url: string;
  };
};

export type SoftwareApplicationJsonLd = {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  url?: string;
  description?: string;
  alternateName?: string;
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

export type WebPageJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebPage" | "CollectionPage" | "ContactPage";
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  isPartOf?: {
    "@type": "WebSite";
    "@id": string;
  };
  about?: {
    "@type": "Thing";
    name: string;
  };
};

export type ItemListJsonLd = {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  description?: string;
  url?: string;
  inLanguage?: string;
  numberOfItems: number;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    item: {
      "@type": "Thing";
      name: string;
      url?: string;
      description?: string;
    };
  }>;
};

export type JobPostingJsonLd = {
  "@context": "https://schema.org";
  "@type": "JobPosting";
  title: string;
  description: string;
  url: string;
  inLanguage: string;
  employmentType?: string;
  datePosted?: string;
  validThrough?: string;
  hiringOrganization: {
    "@type": "Organization";
    name: string;
    sameAs?: string;
    logo?: string;
  };
  jobLocation?: {
    "@type": "Place";
    address: {
      "@type": "PostalAddress";
      addressCountry: string;
      addressLocality?: string;
    };
  };
  applicantLocationRequirements?: {
    "@type": "Country";
    name: string;
  };
  baseSalary?: {
    "@type": "MonetaryAmount";
    currency: string;
    value: {
      "@type": "QuantitativeValue";
      minValue?: number;
      maxValue?: number;
      unitText: string;
    };
  };
  directApply?: boolean;
};

function getSchemaLanguage(locale: MarketingLocale): "ar-SA" | "en-US" {
  return locale === "ar" ? "ar-SA" : "en-US";
}

function normalizeSchemaBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getWebsiteIdFromPageUrl(url: string): string {
  try {
    return `${new URL(url).origin}/#website`;
  } catch {
    return `${normalizeSchemaBaseUrl(url)}/#website`;
  }
}

function getLocalizedSiteIdentity(opts: {
  locale: MarketingLocale;
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}) {
  return {
    language: getSchemaLanguage(opts.locale),
    name: opts.locale === "ar" ? opts.siteNameAr : opts.siteNameEn,
    alternateName: opts.locale === "ar" ? opts.siteNameEn : opts.siteNameAr,
    description: opts.locale === "ar" ? opts.descriptionAr : opts.descriptionEn
  };
}

export function organizationSchema(opts: {
  url: string;
  locale: MarketingLocale;
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}): OrganizationJsonLd {
  const baseUrl = normalizeSchemaBaseUrl(opts.url);
  const sameAs = (process.env.NEXT_PUBLIC_ORGANIZATION_SAME_AS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const identity = getLocalizedSiteIdentity(opts);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: identity.name,
    url: baseUrl,
    logo: `${baseUrl}/icons/logo-navbar-light-1200.png`,
    description: identity.description,
    alternateName: identity.alternateName,
    ...(sameAs.length > 0 ? { sameAs } : {})
  };
}

export function websiteSchema(opts: {
  url: string;
  locale: MarketingLocale;
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}): WebSiteJsonLd {
  const baseUrl = normalizeSchemaBaseUrl(opts.url);
  const identity = getLocalizedSiteIdentity(opts);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: identity.name,
    url: baseUrl,
    description: identity.description,
    alternateName: identity.alternateName,
    inLanguage: identity.language,
    publisher: {
      "@type": "Organization",
      name: identity.name,
      url: baseUrl
    }
  };
}

/**
 * IMPORTANT: We intentionally do NOT hardcode a 5-star rating.
 * If you have real rating data, set NEXT_PUBLIC_RATING_VALUE and NEXT_PUBLIC_RATING_COUNT.
 */
export function softwareAppSchema(opts: {
  url: string;
  locale: MarketingLocale;
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  pricingUrl?: string;
  ratingValue?: number;
  ratingCount?: number;
}): SoftwareApplicationJsonLd {
  const baseUrl = normalizeSchemaBaseUrl(opts.url);
  const ratingValue = typeof opts.ratingValue === "number" ? opts.ratingValue : undefined;
  const ratingCount = typeof opts.ratingCount === "number" ? opts.ratingCount : undefined;
  const hasRating =
    typeof ratingValue === "number" && typeof ratingCount === "number" && ratingCount > 0;
  const identity = getLocalizedSiteIdentity(opts);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: identity.name,
    url: baseUrl,
    description: identity.description,
    alternateName: identity.alternateName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    availableLanguage: ["ar-SA", "en-US"],
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

export function pageSchema(opts: {
  url: string;
  locale: MarketingLocale;
  title: string;
  description: string;
  type?: WebPageJsonLd["@type"];
  about?: string;
}): WebPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": opts.type ?? "WebPage",
    name: opts.title,
    description: opts.description,
    url: opts.url,
    inLanguage: getSchemaLanguage(opts.locale),
    isPartOf: {
      "@type": "WebSite",
      "@id": getWebsiteIdFromPageUrl(opts.url)
    },
    ...(opts.about
      ? {
          about: {
            "@type": "Thing",
            name: opts.about
          }
        }
      : {})
  };
}

export function itemListSchema(opts: {
  url: string;
  locale: MarketingLocale;
  name: string;
  description?: string;
  items: Array<{ name: string; url?: string; description?: string }>;
}): ItemListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: getSchemaLanguage(opts.locale),
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: item.name,
        ...(item.url ? { url: item.url } : {}),
        ...(item.description ? { description: item.description } : {})
      }
    }))
  };
}

export function jobPostingSchema(opts: {
  url: string;
  locale: MarketingLocale;
  title: string;
  description: string;
  employmentType?: string;
  datePosted?: string | null;
  validThrough?: string | null;
  hiringOrganizationName: string;
  hiringOrganizationUrl?: string;
  hiringOrganizationLogo?: string | null;
  jobLocation?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
}): JobPostingJsonLd {
  const salaryMin = typeof opts.salaryMin === "number" ? opts.salaryMin : undefined;
  const salaryMax = typeof opts.salaryMax === "number" ? opts.salaryMax : undefined;
  const hasSalary = salaryMin != null || salaryMax != null;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: opts.title,
    description: opts.description,
    url: opts.url,
    inLanguage: getSchemaLanguage(opts.locale),
    ...(opts.employmentType ? { employmentType: opts.employmentType } : {}),
    ...(opts.datePosted ? { datePosted: opts.datePosted } : {}),
    ...(opts.validThrough ? { validThrough: opts.validThrough } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: opts.hiringOrganizationName,
      ...(opts.hiringOrganizationUrl ? { sameAs: opts.hiringOrganizationUrl } : {}),
      ...(opts.hiringOrganizationLogo ? { logo: opts.hiringOrganizationLogo } : {})
    },
    ...(opts.jobLocation
      ? {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressCountry: "SA",
              addressLocality: opts.jobLocation
            }
          }
        }
      : {
          applicantLocationRequirements: {
            "@type": "Country",
            name: "Saudi Arabia"
          }
        }),
    ...(hasSalary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: opts.salaryCurrency || "SAR",
            value: {
              "@type": "QuantitativeValue",
              ...(salaryMin != null ? { minValue: salaryMin } : {}),
              ...(salaryMax != null ? { maxValue: salaryMax } : {}),
              unitText: "MONTH"
            }
          }
        }
      : {}),
    directApply: true
  };
}
