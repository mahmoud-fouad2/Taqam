import { describe, expect, it } from "vitest";

import {
  buildTenantUrl,
  buildTenantCanonicalUrl,
  buildTenantPath,
  resolveTenantDashboardRewrite,
  extractTenantSlugFromHost,
  extractTenantSlugFromPath,
  resolveTenantRequest
} from "@/lib/tenant";

describe("extractTenantSlugFromHost", () => {
  it("extracts tenant slug from configured base domain", () => {
    expect(extractTenantSlugFromHost("demo.taqam.net", "taqam.net")).toBe("demo");
  });

  it("ignores the apex domain and reserved subdomains", () => {
    expect(extractTenantSlugFromHost("taqam.net", "taqam.net")).toBeNull();
    expect(extractTenantSlugFromHost("www.taqam.net", "taqam.net")).toBeNull();
    expect(extractTenantSlugFromHost("admin.taqam.net", "taqam.net")).toBeNull();
  });

  it("supports local subdomains for development", () => {
    expect(extractTenantSlugFromHost("demo.localhost:3000", "localhost:3000")).toBe("demo");
  });
});

describe("extractTenantSlugFromPath", () => {
  it("extracts tenant slug from tenant path fallback", () => {
    expect(extractTenantSlugFromPath("/t/demo/careers")).toBe("demo");
    expect(extractTenantSlugFromPath("/en/t/demo/careers")).toBe("demo");
  });

  it("returns null for non-tenant paths", () => {
    expect(extractTenantSlugFromPath("/dashboard")).toBeNull();
  });
});

describe("resolveTenantRequest", () => {
  it("prefers the subdomain over the fallback path", () => {
    expect(resolveTenantRequest("/t/other/dashboard", "demo.taqam.net")).toEqual({
      slug: "demo",
      source: "subdomain"
    });
  });

  it("falls back to path-based tenant resolution when there is no tenant subdomain", () => {
    expect(resolveTenantRequest("/t/demo/dashboard", "taqam.net")).toEqual({
      slug: "demo",
      source: "path"
    });
  });
});

describe("resolveTenantDashboardRewrite", () => {
  it("rewrites path fallback dashboard URLs to the internal dashboard path", () => {
    expect(resolveTenantDashboardRewrite("/t/demo/dashboard/settings/profile")).toEqual({
      slug: "demo",
      pathname: "/dashboard/settings/profile",
      locale: "ar"
    });
  });

  it("preserves english locale intent while rewriting the dashboard path", () => {
    expect(resolveTenantDashboardRewrite("/en/t/demo/dashboard")).toEqual({
      slug: "demo",
      pathname: "/dashboard",
      locale: "en"
    });
  });

  it("ignores non-dashboard tenant paths", () => {
    expect(resolveTenantDashboardRewrite("/t/demo/careers")).toBeNull();
  });
});

describe("tenant public URL helpers", () => {
  it("builds localized tenant fallback paths for public portals", () => {
    expect(buildTenantPath("demo", "/careers", "ar")).toBe("/t/demo/careers");
    expect(buildTenantPath("demo", "/careers", "en")).toBe("/en/t/demo/careers");
  });

  it("prefers tenant custom domains when building canonical URLs", () => {
    expect(
      buildTenantCanonicalUrl({ slug: "demo", domain: "jobs.example.com" }, "/careers", {
        locale: "en",
        baseDomain: "taqam.net"
      })
    ).toBe("https://jobs.example.com/en/careers");
  });

  it("forces path fallback for localhost and IP development hosts", () => {
    expect(buildTenantUrl("demo", "/dashboard", "localhost:3001")).toBe(
      "http://localhost:3001/t/demo/dashboard"
    );
    expect(buildTenantUrl("demo", "/dashboard", "127.0.0.1:3001")).toBe(
      "http://127.0.0.1:3001/t/demo/dashboard"
    );
  });
});