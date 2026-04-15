#!/usr/bin/env node
/**
 * Minimal smoke test runner.
 * Usage:
 *  - Start the app: pnpm dev  (or pnpm start)
 *  - Run: pnpm smoke
 *
 * Optional:
 *  - SMOKE_BASE_URL=https://your-domain.com pnpm smoke
 */

const baseUrl = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = [
  { name: "Home", path: "/" },
  { name: "Home EN", path: "/en" },
  { name: "Features", path: "/features" },
  { name: "Features EN", path: "/en/features" },
  { name: "Pricing", path: "/pricing" },
  { name: "Pricing EN", path: "/en/pricing" },
  { name: "Plans", path: "/plans" },
  { name: "Plans EN", path: "/en/plans" },
  { name: "Careers", path: "/careers" },
  { name: "Careers EN", path: "/en/careers" },
  { name: "Walkthrough Request", path: "/request-demo" },
  { name: "Walkthrough Request EN", path: "/en/request-demo" },
  { name: "Help Center", path: "/help-center" },
  { name: "Help Center EN", path: "/en/help-center" },
  { name: "Support", path: "/support" },
  { name: "Support EN", path: "/en/support" },
  { name: "FAQ", path: "/faq" },
  { name: "FAQ EN", path: "/en/faq" },
  { name: "Privacy", path: "/privacy" },
  { name: "Privacy EN", path: "/en/privacy" },
  { name: "Terms", path: "/terms" },
  { name: "Terms EN", path: "/en/terms" },
  { name: "Login", path: "/login" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Robots", path: "/robots.txt", expectTextIncludes: "Sitemap:" },
  { name: "Sitemap", path: "/sitemap.xml", expectTextIncludes: "<urlset" },

  // Health + auth surface
  { name: "Health API", path: "/api/health", expectJson: true },
  { name: "NextAuth Providers", path: "/api/auth/providers", expectJson: true },

  // Core APIs (should not 500 even if auth blocks)
  { name: "Employees API", path: "/api/employees", allowUnauthorized: true },
  { name: "Departments API", path: "/api/departments", allowUnauthorized: true },
  { name: "Documents API", path: "/api/documents", allowUnauthorized: true },
  { name: "Attendance API", path: "/api/attendance", allowUnauthorized: true },
  { name: "Notifications API", path: "/api/notifications", allowUnauthorized: true }
];

function formatStatus(res) {
  return `${res.status} ${res.statusText}`.trim();
}

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 10_000);
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "manual",
      ...opts,
      signal: controller.signal,
      headers: {
        "user-agent": "taqam-smoke/1.0",
        ...(opts.headers || {})
      }
    });
  } finally {
    clearTimeout(t);
  }
}

let failed = 0;

for (const c of checks) {
  const url = `${baseUrl}${c.path}`;
  try {
    const res = await fetchWithTimeout(url);

    // Acceptable outcomes:
    // - 2xx
    // - 3xx redirects (e.g., /dashboard -> /login)
    // - 401/403 for protected APIs (but never 500)
    const ok2xx = res.status >= 200 && res.status < 300;
    const ok3xx = res.status >= 300 && res.status < 400;
    const okAuthBlock = c.allowUnauthorized && (res.status === 401 || res.status === 403);
    const badServer = res.status >= 500;

    let extra = "";
    if (c.expectJson) {
      const text = await res.text();
      try {
        JSON.parse(text);
      } catch {
        extra = " (expected JSON)";
        failed++;
        console.log(`[FAIL] ${c.name}: ${c.path} -> ${formatStatus(res)}${extra}`);
        continue;
      }
    }

    if (c.expectTextIncludes) {
      const text = await res.text();

      if (!text.includes(c.expectTextIncludes)) {
        failed++;
        console.log(
          `[FAIL] ${c.name}: ${c.path} -> ${formatStatus(res)} (expected text containing: ${c.expectTextIncludes})`
        );
        continue;
      }
    }

    if (badServer || !(ok2xx || ok3xx || okAuthBlock)) {
      failed++;
      console.log(`[FAIL] ${c.name}: ${c.path} -> ${formatStatus(res)}${extra}`);
      continue;
    }

    console.log(`[OK]   ${c.name}: ${c.path} -> ${formatStatus(res)}${extra}`);
  } catch (e) {
    failed++;
    const msg =
      e && typeof e === "object" && "name" in e && e.name === "AbortError"
        ? "timeout"
        : e?.message || String(e);
    console.log(`[FAIL] ${c.name}: ${c.path} -> ${msg}`);
  }
}

if (failed > 0) {
  console.log(`\nSmoke: FAILED (${failed} check(s))`);
  process.exit(1);
}

console.log("\nSmoke: OK");
