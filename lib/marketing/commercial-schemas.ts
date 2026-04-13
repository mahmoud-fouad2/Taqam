import { z } from "zod";

const commercialText = z.string().trim().min(2).max(160);
const optionalCommercialText = z.string().trim().max(160).nullable().optional();
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");
const priceSchema = z.number().finite().nonnegative().max(999999).nullable().optional();
const featureListSchema = z.array(z.string().trim().min(1).max(200)).max(30);

export const pricingPlanPayloadSchema = z
  .object({
    name: commercialText,
    nameAr: commercialText,
    slug: slugSchema,
    priceMonthly: priceSchema,
    priceYearly: priceSchema,
    currency: z.string().trim().min(3).max(10).default("SAR"),
    maxEmployees: z.number().int().positive().max(100000).nullable().optional(),
    employeesLabel: optionalCommercialText,
    employeesLabelEn: optionalCommercialText,
    featuresAr: featureListSchema.default([]),
    featuresEn: featureListSchema.default([]),
    planType: z.enum(["TRIAL", "BASIC", "PROFESSIONAL", "ENTERPRISE"]).default("TRIAL"),
    isPopular: z.boolean().default(false),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(9999).default(0)
  })
  .refine((data) => data.featuresAr.length === data.featuresEn.length, {
    message: "Arabic and English feature lists must have the same number of items",
    path: ["featuresEn"]
  });

export const comparisonFeaturePayloadSchema = z
  .object({
    featureAr: commercialText,
    featureEn: commercialText,
    inStarter: z.boolean().default(false),
    inBusiness: z.boolean().default(false),
    inEnterprise: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(9999).default(0),
    isActive: z.boolean().default(true)
  })
  .refine((data) => data.inStarter || data.inBusiness || data.inEnterprise, {
    message: "At least one plan must be selected",
    path: ["inStarter"]
  });