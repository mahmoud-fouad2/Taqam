import { prisma } from "@/lib/db";
import {
  commercialFeatureSchema,
  defaultCommercialClaimsRegistry,
  defaultCommercialFeatureCatalog,
  defaultMarketingFeatureSuites,
  defaultMarketingIntegrationShowcase,
  defaultMarketingPersonaShowcase,
  defaultMarketingTestimonials,
  type CommercialFeature
} from "@/lib/marketing/commercial-registry";

export type ManagedCommercialFeatureRow = {
  id: string;
  featureId: string;
  family: string;
  nameAr: string;
  nameEn: string;
  summaryAr: string;
  summaryEn: string;
  status: string;
  commercialTier: string;
  availability: string[];
  evidencePaths: string[];
  owner: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

const defaultFeatureIds = new Set(defaultCommercialFeatureCatalog.map((feature) => feature.id));

async function ensurePlatformSettings() {
  let settings = await prisma.platformSettings.findFirst({
    select: { id: true }
  });

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        platformName: "طاقم",
        platformNameEn: "Taqam",
        supportEmail: "support@taqam.net",
        trialDays: 14,
        trialMaxEmployees: 10,
        primaryColor: "#0284c7"
      },
      select: { id: true }
    });
  }

  return settings;
}

export async function seedDefaultCommercialFeatureCatalog() {
  const settings = await ensurePlatformSettings();

  const existingRows = await prisma.commercialFeatureCatalogEntry.findMany({
    select: { featureId: true }
  });
  const existingIds = new Set(existingRows.map((row) => row.featureId));

  const missingDefaults = defaultCommercialFeatureCatalog
    .map((feature, index) => ({ feature, index }))
    .filter(({ feature }) => !existingIds.has(feature.id));

  if (missingDefaults.length === 0) {
    return;
  }

  await prisma.commercialFeatureCatalogEntry.createMany({
    data: missingDefaults.map(({ feature, index }) => ({
      platformSettingsId: settings.id,
      featureId: feature.id,
      family: feature.family,
      nameAr: feature.name.ar,
      nameEn: feature.name.en,
      summaryAr: feature.summary.ar,
      summaryEn: feature.summary.en,
      status: feature.status,
      commercialTier: feature.commercialTier,
      availability: feature.availability,
      evidencePaths: feature.evidencePaths,
      owner: feature.owner,
      sortOrder: index,
      isActive: true
    }))
  });
}

export function getFeatureCatalogReferences(featureId: string) {
  const references: string[] = [];

  for (const claim of defaultCommercialClaimsRegistry) {
    if (claim.linkedFeatureIds.includes(featureId)) {
      references.push(`claim:${claim.id}`);
    }
  }

  for (const item of defaultMarketingIntegrationShowcase) {
    if (item.linkedFeatureIds.includes(featureId)) {
      references.push(`integration:${item.id}`);
    }
  }

  for (const item of defaultMarketingPersonaShowcase) {
    if (item.linkedFeatureIds.includes(featureId)) {
      references.push(`persona:${item.id}`);
    }
  }

  for (const item of defaultMarketingTestimonials) {
    if (item.linkedFeatureIds.includes(featureId)) {
      references.push(`testimonial:${item.id}`);
    }
  }

  for (const suite of defaultMarketingFeatureSuites) {
    for (const item of suite.items) {
      if (item.linkedFeatureIds.includes(featureId)) {
        references.push(`suite:${suite.id}:${item.id}`);
      }
    }
  }

  return references;
}

export async function listManagedCommercialFeatureCatalog(options?: {
  includeInactive?: boolean;
}) {
  await seedDefaultCommercialFeatureCatalog();

  const rows = await prisma.commercialFeatureCatalogEntry.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { featureId: "asc" }]
  });

  return rows;
}

export async function getManagedCommercialFeatureCatalog(): Promise<CommercialFeature[]> {
  const rows = await listManagedCommercialFeatureCatalog();

  return rows.map((row) =>
    commercialFeatureSchema.parse({
      id: row.featureId,
      family: row.family,
      name: { ar: row.nameAr, en: row.nameEn },
      summary: { ar: row.summaryAr, en: row.summaryEn },
      status: row.status,
      commercialTier: row.commercialTier,
      availability: row.availability,
      evidencePaths: row.evidencePaths,
      owner: row.owner
    })
  );
}

export async function getManagedCommercialFeatureCatalogRows(): Promise<ManagedCommercialFeatureRow[]> {
  const rows = await listManagedCommercialFeatureCatalog({ includeInactive: true });

  return rows.map((row) => ({
    id: row.id,
    featureId: row.featureId,
    family: row.family,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    summaryAr: row.summaryAr,
    summaryEn: row.summaryEn,
    status: row.status,
    commercialTier: row.commercialTier,
    availability: row.availability,
    evidencePaths: row.evidencePaths,
    owner: row.owner,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    isDefault: defaultFeatureIds.has(row.featureId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }));
}

export function isDefaultCommercialFeatureId(featureId: string) {
  return defaultFeatureIds.has(featureId);
}