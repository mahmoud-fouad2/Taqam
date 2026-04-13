import { describe, expect, it } from "vitest";

import {
  fallbackComparison,
  fallbackPlans,
  getPricingMarketingContent,
  getPricingPlanTagline
} from "@/lib/marketing/pricing";

function assertUnique(values: string[], label: string) {
  const set = new Set(values);
  expect(set.size, `${label} should be unique`).toBe(values.length);
}

function deepCollectStrings(value: unknown, path: string, out: Array<{ path: string; value: string }>) {
  if (typeof value === "string") {
    out.push({ path, value });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => deepCollectStrings(entry, `${path}[${index}]`, out));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      deepCollectStrings(entry, path ? `${path}.${key}` : key, out);
    }
  }
}

describe("marketing pricing content", () => {
  it("ships valid fallback plans", () => {
    expect(fallbackPlans.length).toBeGreaterThanOrEqual(3);

    assertUnique(
      fallbackPlans.map((plan) => plan.slug),
      "plan slugs"
    );

    const sorted = [...fallbackPlans].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(fallbackPlans.map((plan) => plan.slug)).toEqual(sorted.map((plan) => plan.slug));

    for (const plan of fallbackPlans) {
      expect(plan.slug.trim().length).toBeGreaterThan(0);
      expect(plan.name.trim().length).toBeGreaterThan(0);
      expect(plan.nameAr.trim().length).toBeGreaterThan(0);
      expect(plan.currency.trim().length).toBeGreaterThan(0);

      expect(["TRIAL", "BASIC", "PROFESSIONAL", "ENTERPRISE"]).toContain(plan.planType);

      expect(plan.featuresAr.length, `${plan.slug} featuresAr`).toBeGreaterThan(0);
      expect(plan.featuresEn.length, `${plan.slug} featuresEn`).toBeGreaterThan(0);
    }
  });

  it("ships valid fallback comparison rows", () => {
    expect(fallbackComparison.length).toBeGreaterThan(0);

    assertUnique(
      fallbackComparison.map((row) => row.featureEn),
      "comparison featureEn"
    );

    const sorted = [...fallbackComparison].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(fallbackComparison.map((row) => row.featureEn)).toEqual(sorted.map((row) => row.featureEn));

    for (const row of fallbackComparison) {
      expect(row.featureAr.trim().length).toBeGreaterThan(0);
      expect(row.featureEn.trim().length).toBeGreaterThan(0);
    }
  });

  it("provides non-empty marketing copy", async () => {
    const content = await getPricingMarketingContent();
    const strings: Array<{ path: string; value: string }> = [];
    deepCollectStrings(content, "", strings);

    // Guard against accidentally blanking copy.
    for (const entry of strings) {
      expect(entry.value.trim().length, entry.path).toBeGreaterThan(0);
    }
  });

  it("returns a tagline for each plan type", () => {
    const basics = getPricingPlanTagline({ isPopular: false, planType: "BASIC" });
    const pro = getPricingPlanTagline({ isPopular: false, planType: "PROFESSIONAL" });
    const enterprise = getPricingPlanTagline({ isPopular: false, planType: "ENTERPRISE" });
    const popular = getPricingPlanTagline({ isPopular: true, planType: "BASIC" });

    for (const tagline of [basics, pro, enterprise, popular]) {
      expect(tagline.ar.trim().length).toBeGreaterThan(0);
      expect(tagline.en.trim().length).toBeGreaterThan(0);
    }
  });
});
