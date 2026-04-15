import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getCommercialClaimsRegistry,
  getCommercialClaimsBySurface,
  getCommercialFeatureCatalog,
  getMarketingFeatureSuites,
  getMarketingIntegrationShowcase,
  getMarketingPersonaShowcase,
  getMarketingTestimonials
} from "@/lib/marketing/commercial-registry";

const ROUTE_FILES = new Set(["page.tsx", "page.ts", "page.jsx", "page.js", "route.ts", "route.js"]);

let cachedAppRoutes: Set<string> | null = null;

function getKnownAppRoutes() {
  if (cachedAppRoutes) {
    return cachedAppRoutes;
  }

  const appDir = join(process.cwd(), "app");
  const routes = new Set<string>();

  function normalizeSegment(segment: string) {
    if (!segment) return null;
    if (segment.startsWith("(") && segment.endsWith(")")) return null;
    if (segment.startsWith("@")) return null;

    if (segment.startsWith("[[...") && segment.endsWith("]]")) {
      const param = segment.slice(5, -2);
      return `*${param}?`;
    }

    if (segment.startsWith("[...") && segment.endsWith("]")) {
      const param = segment.slice(4, -1);
      return `*${param}`;
    }

    if (segment.startsWith("[") && segment.endsWith("]")) {
      const param = segment.slice(1, -1);
      return `:${param}`;
    }

    return segment;
  }

  function addRouteForDir(dir: string, hasRouteFile: boolean) {
    if (!hasRouteFile) return;

    const rel = relative(appDir, dir);
    const rawSegments = rel ? rel.split(/[/\\]+/) : [];
    const segments: string[] = [];

    for (const raw of rawSegments) {
      const normalized = normalizeSegment(raw);
      if (normalized) {
        segments.push(normalized);
      }
    }

    const routePath = segments.length === 0 ? "/" : `/${segments.join("/")}`;
    routes.add(routePath);
  }

  function walk(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    const hasRouteFile = entries.some((entry) => entry.isFile() && ROUTE_FILES.has(entry.name));
    addRouteForDir(dir, hasRouteFile);

    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(join(dir, entry.name));
      }
    }
  }

  if (existsSync(appDir)) {
    walk(appDir);
  }

  cachedAppRoutes = routes;
  return routes;
}

function hasRouteOrDescendant(route: string, routes: Set<string>) {
  const normalized = route.trim().replace(/\/+$/, "") || "/";

  if (normalized === "/") {
    return routes.has("/") || routes.size > 0;
  }

  if (routes.has(normalized)) {
    return true;
  }

  const prefix = `${normalized}/`;
  for (const candidate of routes) {
    if (candidate.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

function assertUnique(values: string[], label: string) {
  const set = new Set(values);
  expect(set.size, `${label} should be unique`).toBe(values.length);
}

describe("commercial registry content", () => {
  it("ships a valid commercial feature catalog", () => {
    const features = getCommercialFeatureCatalog();
    expect(features.length).toBeGreaterThan(0);

    assertUnique(
      features.map((feature) => feature.id),
      "feature ids"
    );

    for (const feature of features) {
      expect(feature.id.trim().length).toBeGreaterThan(0);
      expect(feature.owner.trim().length).toBeGreaterThan(0);
      expect(feature.availability.length).toBeGreaterThan(0);

      for (const locale of ["ar", "en"] as const) {
        expect(feature.name[locale].trim().length, `${feature.id}.name.${locale}`).toBeGreaterThan(
          0
        );
        expect(
          feature.summary[locale].trim().length,
          `${feature.id}.summary.${locale}`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("ships evidence paths that exist in the repo", () => {
    const features = getCommercialFeatureCatalog();
    const routes = getKnownAppRoutes();

    for (const feature of features) {
      for (const evidencePath of feature.evidencePaths) {
        const value = evidencePath.trim();
        expect(value.length, `${feature.id}.evidencePaths`).toBeGreaterThan(0);

        if (value.startsWith("/")) {
          expect(
            hasRouteOrDescendant(value, routes),
            `${feature.id} evidence route missing: ${value}`
          ).toBe(true);
          continue;
        }

        const normalized = value.replaceAll("\\\\", "/").replace(/^\.?\//, "");
        const absolute = join(process.cwd(), normalized);
        expect(existsSync(absolute), `${feature.id} evidence path missing: ${normalized}`).toBe(
          true
        );
      }
    }
  });

  it("ships a valid claims registry with live-only gating", () => {
    const features = getCommercialFeatureCatalog();
    const featureIds = new Set(features.map((feature) => feature.id));
    const featureStatusById = new Map(
      features.map((feature) => [feature.id, feature.status] as const)
    );

    const claims = getCommercialClaimsRegistry();
    expect(claims.length).toBeGreaterThan(0);

    assertUnique(
      claims.map((claim) => claim.id),
      "claim ids"
    );

    assertUnique(
      claims.map((claim) => `${claim.surface}:${claim.slot}`),
      "claim surface+slot"
    );

    for (const claim of claims) {
      expect(claim.linkedFeatureIds.length, `${claim.id}.linkedFeatureIds`).toBeGreaterThan(0);

      for (const linkedFeatureId of claim.linkedFeatureIds) {
        expect(
          featureIds.has(linkedFeatureId),
          `${claim.id} links to missing feature: ${linkedFeatureId}`
        ).toBe(true);
      }

      for (const locale of ["ar", "en"] as const) {
        expect(claim.title[locale].trim().length, `${claim.id}.title.${locale}`).toBeGreaterThan(0);
        expect(
          claim.description[locale].trim().length,
          `${claim.id}.description.${locale}`
        ).toBeGreaterThan(0);
      }

      if (claim.statusGate === "live-only") {
        for (const linkedFeatureId of claim.linkedFeatureIds) {
          expect(
            featureStatusById.get(linkedFeatureId),
            `${claim.id} linked feature not found: ${linkedFeatureId}`
          ).toBe("live");
        }
      }
    }
  });

  it("ships required careers differentiator card claims", () => {
    const claims = getCommercialClaimsBySurface("careers.differentiator");
    const bySlot = new Map(claims.map((claim) => [claim.slot, claim] as const));

    const requiredSlots = ["company-portal", "jobs-hub", "integrated-applications"] as const;

    for (const slot of requiredSlots) {
      const claim = bySlot.get(slot);
      expect(claim, `careers.differentiator missing slot: ${slot}`).toBeTruthy();

      if (!claim) {
        continue;
      }

      expect(claim.visibility, `careers.differentiator.${slot}.visibility`).toBe("public");
      expect(claim.statusGate, `careers.differentiator.${slot}.statusGate`).toBe("live-only");
      expect(
        claim.linkedFeatureIds.length,
        `careers.differentiator.${slot}.linkedFeatureIds`
      ).toBeGreaterThan(0);

      for (const locale of ["ar", "en"] as const) {
        expect(
          claim.title[locale].trim().length,
          `careers.differentiator.${slot}.title.${locale}`
        ).toBeGreaterThan(0);
        expect(
          claim.description[locale].trim().length,
          `careers.differentiator.${slot}.description.${locale}`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("ships valid integration showcase items", () => {
    const integrations = getMarketingIntegrationShowcase();
    expect(integrations.length).toBeGreaterThan(0);
    assertUnique(
      integrations.map((item) => item.id),
      "integration ids"
    );

    const featureIds = new Set(getCommercialFeatureCatalog().map((feature) => feature.id));
    const liveItems = integrations.filter((item) => item.availability === "live");
    expect(liveItems.length).toBeGreaterThan(0);

    for (const item of integrations) {
      for (const locale of ["ar", "en"] as const) {
        expect(item.name[locale].trim().length, `${item.id}.name.${locale}`).toBeGreaterThan(0);
        expect(
          item.description[locale].trim().length,
          `${item.id}.description.${locale}`
        ).toBeGreaterThan(0);
      }

      expect(item.logoSrc.trim().length, `${item.id}.logoSrc`).toBeGreaterThan(0);
      expect(item.frameClassName.trim().length, `${item.id}.frameClassName`).toBeGreaterThan(0);
      expect(item.imageClassName.trim().length, `${item.id}.imageClassName`).toBeGreaterThan(0);

      if (item.availability === "live") {
        expect(item.linkedFeatureIds.length, `${item.id}.linkedFeatureIds`).toBeGreaterThan(0);
      }

      for (const linkedFeatureId of item.linkedFeatureIds) {
        expect(
          featureIds.has(linkedFeatureId),
          `${item.id} links to missing feature: ${linkedFeatureId}`
        ).toBe(true);
      }
    }
  });

  it("ships valid persona showcase items", () => {
    const personas = getMarketingPersonaShowcase();
    expect(personas.length).toBeGreaterThan(0);
    assertUnique(
      personas.map((item) => item.id),
      "persona ids"
    );

    const featureIds = new Set(getCommercialFeatureCatalog().map((feature) => feature.id));

    for (const persona of personas) {
      for (const locale of ["ar", "en"] as const) {
        expect(persona.role[locale].trim().length, `${persona.id}.role.${locale}`).toBeGreaterThan(
          0
        );
        expect(
          persona.title[locale].trim().length,
          `${persona.id}.title.${locale}`
        ).toBeGreaterThan(0);
        expect(
          persona.description[locale].trim().length,
          `${persona.id}.description.${locale}`
        ).toBeGreaterThan(0);
        expect(
          persona.visualCaption[locale].trim().length,
          `${persona.id}.visualCaption.${locale}`
        ).toBeGreaterThan(0);
      }

      expect(persona.highlights.length, `${persona.id}.highlights`).toBeGreaterThanOrEqual(2);
      expect(persona.linkedFeatureIds.length, `${persona.id}.linkedFeatureIds`).toBeGreaterThan(0);

      for (const linkedFeatureId of persona.linkedFeatureIds) {
        expect(
          featureIds.has(linkedFeatureId),
          `${persona.id} links to missing feature: ${linkedFeatureId}`
        ).toBe(true);
      }
    }
  });

  it("ships valid marketing testimonials", () => {
    const testimonials = getMarketingTestimonials();
    expect(testimonials.length).toBeGreaterThan(0);

    assertUnique(
      testimonials.map((item) => item.id),
      "testimonial ids"
    );

    const features = getCommercialFeatureCatalog();
    const featureIds = new Set(features.map((feature) => feature.id));
    const featureStatusById = new Map(
      features.map((feature) => [feature.id, feature.status] as const)
    );

    for (const testimonial of testimonials) {
      expect(testimonial.avatarSrc.trim().length, `${testimonial.id}.avatarSrc`).toBeGreaterThan(0);
      expect(
        testimonial.linkedFeatureIds.length,
        `${testimonial.id}.linkedFeatureIds`
      ).toBeGreaterThan(0);

      for (const locale of ["ar", "en"] as const) {
        expect(
          testimonial.quote[locale].trim().length,
          `${testimonial.id}.quote.${locale}`
        ).toBeGreaterThan(0);
        expect(
          testimonial.name[locale].trim().length,
          `${testimonial.id}.name.${locale}`
        ).toBeGreaterThan(0);
        expect(
          testimonial.role[locale].trim().length,
          `${testimonial.id}.role.${locale}`
        ).toBeGreaterThan(0);
      }

      for (const linkedFeatureId of testimonial.linkedFeatureIds) {
        expect(
          featureIds.has(linkedFeatureId),
          `${testimonial.id} links to missing feature: ${linkedFeatureId}`
        ).toBe(true);
      }

      if (testimonial.statusGate === "live-only") {
        for (const linkedFeatureId of testimonial.linkedFeatureIds) {
          expect(
            featureStatusById.get(linkedFeatureId),
            `${testimonial.id} linked feature not found: ${linkedFeatureId}`
          ).toBe("live");
        }
      }
    }
  });

  it("ships valid marketing feature suites", () => {
    const features = getCommercialFeatureCatalog();
    const featureIds = new Set(features.map((feature) => feature.id));
    const featureStatusById = new Map(
      features.map((feature) => [feature.id, feature.status] as const)
    );

    const suites = getMarketingFeatureSuites();
    expect(suites.length).toBeGreaterThan(0);

    assertUnique(
      suites.map((suite) => suite.id),
      "suite ids"
    );

    for (const suite of suites) {
      for (const locale of ["ar", "en"] as const) {
        expect(suite.title[locale].trim().length, `${suite.id}.title.${locale}`).toBeGreaterThan(0);
        expect(
          suite.eyebrow[locale].trim().length,
          `${suite.id}.eyebrow.${locale}`
        ).toBeGreaterThan(0);
        expect(
          suite.summary[locale].trim().length,
          `${suite.id}.summary.${locale}`
        ).toBeGreaterThan(0);
      }

      expect(suite.outcomes.length, `${suite.id}.outcomes`).toBeGreaterThan(0);
      expect(suite.items.length, `${suite.id}.items`).toBeGreaterThan(0);

      assertUnique(
        suite.items.map((item) => item.id),
        `${suite.id} item ids`
      );

      for (const outcome of suite.outcomes) {
        for (const locale of ["ar", "en"] as const) {
          expect(outcome[locale].trim().length, `${suite.id}.outcomes.${locale}`).toBeGreaterThan(
            0
          );
        }
      }

      for (const item of suite.items) {
        expect(
          item.linkedFeatureIds.length,
          `${suite.id}.${item.id}.linkedFeatureIds`
        ).toBeGreaterThan(0);

        for (const locale of ["ar", "en"] as const) {
          expect(
            item.title[locale].trim().length,
            `${suite.id}.${item.id}.title.${locale}`
          ).toBeGreaterThan(0);
          expect(
            item.description[locale].trim().length,
            `${suite.id}.${item.id}.description.${locale}`
          ).toBeGreaterThan(0);
        }

        for (const linkedFeatureId of item.linkedFeatureIds) {
          expect(
            featureIds.has(linkedFeatureId),
            `${suite.id}.${item.id} links to missing feature: ${linkedFeatureId}`
          ).toBe(true);
        }

        if (item.statusGate === "live-only") {
          for (const linkedFeatureId of item.linkedFeatureIds) {
            expect(
              featureStatusById.get(linkedFeatureId),
              `${suite.id}.${item.id} linked feature not found: ${linkedFeatureId}`
            ).toBe("live");
          }
        }
      }
    }
  });
});
