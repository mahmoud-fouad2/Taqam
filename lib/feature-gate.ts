/**
 * Feature Gate — Plan-Based Access Control
 *
 * Each feature key maps to the minimum TenantPlan required to use it.
 * Plans are ordered: TRIAL < BASIC < PROFESSIONAL < ENTERPRISE.
 *
 * Usage:
 *   if (!hasFeature(tenant.plan, "integrations")) {
 *     return NextResponse.json({ error: "...", code: "PLAN_UPGRADE_REQUIRED" }, { status: 403 });
 *   }
 */
import type { TenantPlan } from "@prisma/client";

/** Numeric tier — higher = more capable plan */
const PLAN_TIER: Record<TenantPlan, number> = {
  TRIAL: 0,
  BASIC: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3
};

export type FeatureKey =
  | "integrations" // External system connections (GOSI, WPS, …)
  | "payroll" // Payroll processing & payslips
  | "recruitment" // Job postings, applicants, interviews
  | "onboarding" // Onboarding templates & processes
  | "advanced-analytics" // Detailed reports and dashboards
  | "training" // Training courses & enrollments
  | "loans" // Employee loans & advances
  | "api-access" // Dedicated API key / REST access
  | "custom-branding" // White-label / custom domain
  | "audit-log"; // Full audit log access

/** Minimum plan required per feature */
const FEATURE_MIN_PLAN: Record<FeatureKey, TenantPlan> = {
  integrations: "PROFESSIONAL",
  payroll: "PROFESSIONAL",
  "advanced-analytics": "PROFESSIONAL",
  training: "PROFESSIONAL",
  loans: "BASIC",
  recruitment: "BASIC",
  onboarding: "BASIC",
  "audit-log": "PROFESSIONAL",
  "api-access": "ENTERPRISE",
  "custom-branding": "ENTERPRISE"
};

/**
 * Returns true if the given plan includes access to the feature.
 */
export function hasFeature(plan: TenantPlan, feature: FeatureKey): boolean {
  const minPlan = FEATURE_MIN_PLAN[feature];
  return PLAN_TIER[plan] >= PLAN_TIER[minPlan];
}

/**
 * Returns the minimum plan name (in Arabic) required for a feature.
 * Useful for upgrade prompt messages.
 */
export function requiredPlanAr(feature: FeatureKey): string {
  const plan = FEATURE_MIN_PLAN[feature];
  const labels: Record<TenantPlan, string> = {
    TRIAL: "تجريبي",
    BASIC: "الأساسية",
    PROFESSIONAL: "الاحترافية",
    ENTERPRISE: "المؤسسات"
  };
  return labels[plan];
}
