import { z } from "zod";

const localizedTextSchema = z.object({
  ar: z.string().trim().min(1).max(500),
  en: z.string().trim().min(1).max(500)
});

const sectionContentSchema = z.object({
  badge: localizedTextSchema,
  title: localizedTextSchema,
  description: localizedTextSchema
});

const requestDemoHighlightSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema
});

export const platformSiteContentSchema = z.object({
  siteNameAr: z.string().trim().min(1).max(120),
  siteNameEn: z.string().trim().min(1).max(120),
  defaultDescriptionAr: z.string().trim().min(1).max(500),
  defaultDescriptionEn: z.string().trim().min(1).max(500),
  defaultKeywordsAr: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
  defaultKeywordsEn: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
  home: z.object({
    badge: localizedTextSchema,
    title: localizedTextSchema,
    description: localizedTextSchema,
    primaryCtaLabel: localizedTextSchema,
    primaryCtaHref: z.string().trim().min(1).max(200)
  }),
  pricing: sectionContentSchema,
  careers: sectionContentSchema,
  requestDemo: z.object({
    badge: localizedTextSchema,
    title: localizedTextSchema,
    description: localizedTextSchema,
    formTitle: localizedTextSchema,
    formDescription: localizedTextSchema,
    sideTitle: localizedTextSchema,
    sideDescription: localizedTextSchema,
    secondaryCtaTitle: localizedTextSchema,
    secondaryCtaDescription: localizedTextSchema,
    secondaryCtaLabel: localizedTextSchema,
    highlights: z.array(requestDemoHighlightSchema).min(3).max(3)
  })
});