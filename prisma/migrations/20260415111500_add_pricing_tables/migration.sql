-- CreateTable
CREATE TABLE IF NOT EXISTS "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "priceMonthly" DECIMAL(10,2),
    "priceYearly" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "maxEmployees" INTEGER,
    "employeesLabel" TEXT,
    "employeesLabelEn" TEXT,
    "featuresAr" JSONB NOT NULL DEFAULT '[]',
    "featuresEn" JSONB NOT NULL DEFAULT '[]',
    "planType" "TenantPlan" NOT NULL DEFAULT 'TRIAL',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanFeatureComparison" (
    "id" TEXT NOT NULL,
    "featureAr" TEXT NOT NULL,
    "featureEn" TEXT NOT NULL,
    "inStarter" BOOLEAN NOT NULL DEFAULT false,
    "inBusiness" BOOLEAN NOT NULL DEFAULT false,
    "inEnterprise" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanFeatureComparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PricingPlan_slug_key" ON "PricingPlan"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PricingPlan_isActive_sortOrder_idx" ON "PricingPlan"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanFeatureComparison_isActive_sortOrder_idx" ON "PlanFeatureComparison"("isActive", "sortOrder");