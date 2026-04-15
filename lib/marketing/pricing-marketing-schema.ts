import { z } from "zod";

const localizedMarketingTextSchema = z.object({
  ar: z.string().trim().min(1).max(500),
  en: z.string().trim().min(1).max(500)
});

export const pricingMarketingContentSchema = z.object({
  pricingPage: z.object({
    heroPrimaryCtaLabel: localizedMarketingTextSchema,
    heroSecondaryCtaLabel: localizedMarketingTextSchema,
    plansSectionTitle: localizedMarketingTextSchema,
    plansSectionDescription: localizedMarketingTextSchema,
    comparisonSectionTitle: localizedMarketingTextSchema,
    comparisonSectionDescription: localizedMarketingTextSchema,
    comparisonFootnote: localizedMarketingTextSchema,
    customCtaTitle: localizedMarketingTextSchema,
    customCtaDescription: localizedMarketingTextSchema,
    customCtaPrimaryLabel: localizedMarketingTextSchema,
    customCtaSecondaryLabel: localizedMarketingTextSchema,
    popularBadge: localizedMarketingTextSchema,
    planCardPrimaryCtaLabel: localizedMarketingTextSchema
  }),
  plansPage: z.object({
    heroBadge: localizedMarketingTextSchema,
    heroTitle: localizedMarketingTextSchema,
    heroDescription: localizedMarketingTextSchema,
    heroPrimaryCtaLabel: localizedMarketingTextSchema,
    heroSecondaryCtaLabel: localizedMarketingTextSchema,
    breakdownSectionTitle: localizedMarketingTextSchema,
    breakdownSectionDescription: localizedMarketingTextSchema,
    addonsSectionTitle: localizedMarketingTextSchema,
    addonsSectionDescription: localizedMarketingTextSchema,
    recommendationCtaTitle: localizedMarketingTextSchema,
    recommendationCtaDescription: localizedMarketingTextSchema,
    recommendationCtaPrimaryLabel: localizedMarketingTextSchema,
    recommendationCtaSecondaryLabel: localizedMarketingTextSchema,
    popularBadge: localizedMarketingTextSchema,
    planCardPrimaryCtaLabel: localizedMarketingTextSchema,
    taglines: z.object({
      basic: localizedMarketingTextSchema,
      professional: localizedMarketingTextSchema,
      enterprise: localizedMarketingTextSchema,
      popular: localizedMarketingTextSchema
    })
  }),
  addons: z.array(localizedMarketingTextSchema).min(1).max(12)
});
