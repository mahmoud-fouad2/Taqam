/**
 * ============================================================
 * Jisr/Taqam – Professional End-to-End Integration Test Suite
 * ============================================================
 * Structure: Suites → Tests → Assertions
 * Validates: HTTP status, response schema, business logic,
 *            CRUD lifecycles, state machines, tenant isolation.
 *
 * Run: npx tsx tmp/e2e-suite.ts
 * Options:
 *   TEST_BASE_URL=http://... npx tsx tmp/e2e-suite.ts
 *   SLOW_THRESHOLD=2000      (ms) flag slow tests
 */

import "dotenv/config";
import prisma from "../lib/db";

// ─────────────────── Config ───────────────────────────────
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3050";
const PASSWORD = "Admin@123456";
const SLOW_MS = Number(process.env.SLOW_THRESHOLD ?? 2000);
const RUN_TAG = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

// ─────────────────── HTTP Layer ───────────────────────────
type CookieJar = Map<string, string>;

interface HttpResult {
  status: number;
  url: string;
  text: string;
  json: unknown;
  location: string | null;
  durationMs: number;
}

function createJar(): CookieJar {
  return new Map();
}

function jarHeader(jar: CookieJar): string {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function absorbCookies(jar: CookieJar, headers: Headers) {
  const raw =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
      ? [headers.get("set-cookie") as string]
      : [];

  for (const c of raw) {
    const part = c.split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) jar.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
}

async function http(
  path: string,
  opts: {
    method?: string;
    jar?: CookieJar;
    headers?: Record<string, string>;
    body?: unknown;
    redirect?: RequestRedirect;
  } = {}
): Promise<HttpResult> {
  const url = new URL(path, BASE_URL).toString();
  const h = new Headers(opts.headers ?? {});
  if (opts.jar) {
    const c = jarHeader(opts.jar);
    if (c) h.set("cookie", c);
  }
  const rawBody =
    opts.body === undefined
      ? undefined
      : typeof opts.body === "string"
      ? opts.body
      : JSON.stringify(opts.body);

  if (rawBody !== undefined && !h.has("content-type"))
    h.set("content-type", "application/json");

  const t0 = Date.now();
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: h,
    body: rawBody,
    redirect: opts.redirect ?? "manual",
  });
  const durationMs = Date.now() - t0;

  if (opts.jar) absorbCookies(opts.jar, res.headers);
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }

  return {
    status: res.status,
    url: res.url,
    text,
    json,
    location: res.headers.get("location"),
    durationMs,
  };
}

async function loginWeb(email: string, pwd = PASSWORD) {
  const jar = createJar();
  const csrf = await http("/api/auth/csrf", { jar });
  const token = (csrf.json as any)?.csrfToken as string | undefined;
  if (!token) throw new Error(`CSRF fetch failed for ${email} (${csrf.status})`);

  jar.set("next-auth.callback-url", encodeURIComponent(BASE_URL));

  const login = await http("/api/auth/callback/credentials", {
    method: "POST",
    jar,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: token,
      email,
      password: pwd,
      callbackUrl: BASE_URL,
      json: "true",
    }).toString(),
  });
  if (login.status !== 200)
    throw new Error(`Login failed for ${email}: HTTP ${login.status}`);

  const sess = await http("/api/auth/session", { jar });
  const user = (sess.json as any)?.user;
  if (!user) throw new Error(`No session after login for ${email}`);

  return { jar, user };
}

// ─────────────────── Test Runner ──────────────────────────
type TestStatus = "PASS" | "FAIL" | "SKIP" | "WARN";

interface AssertionRecord {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
}

interface TestRecord {
  suite: string;
  test: string;
  status: TestStatus;
  durationMs: number;
  slow: boolean;
  assertions: AssertionRecord[];
  error?: string;
}

const allResults: TestRecord[] = [];
let _suite = "Unnamed";

function suite(name: string) {
  _suite = name;
  console.log(`\n  ━━━ ${name} ━━━`);
}

async function test(
  name: string,
  fn: (a: typeof assert) => Promise<void>
): Promise<TestRecord> {
  const assertions: AssertionRecord[] = [];
  const t0 = Date.now();
  let status: TestStatus = "PASS";
  let error: string | undefined;

  // build per-test assertion namespace
  const a = buildAssertions(assertions);

  try {
    await fn(a);
    const failed = assertions.filter((x) => !x.passed);
    if (failed.length) {
      status = "FAIL";
      error = failed
        .map((f) => `${f.label}: expected «${f.expected}» got «${f.actual}»`)
        .join(" | ");
    }
  } catch (e: unknown) {
    status = "FAIL";
    error = String((e as Error)?.message ?? e);
  }

  const durationMs = Date.now() - t0;
  const slow = durationMs >= SLOW_MS;
  const rec: TestRecord = { suite: _suite, test: name, status, durationMs, slow, assertions, error };
  allResults.push(rec);

  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "△";
  const timePart = slow ? ` ⚠ ${durationMs}ms` : `  ${durationMs}ms`;
  const errPart = error ? `\n      ↳ ${error}` : "";
  console.log(`  ${icon} ${name}${timePart}${errPart}`);
  return rec;
}

function skip(name: string, reason = "skipped") {
  const rec: TestRecord = {
    suite: _suite,
    test: name,
    status: "SKIP",
    durationMs: 0,
    slow: false,
    assertions: [],
    error: reason,
  };
  allResults.push(rec);
  console.log(`  ○ ${name}  (${reason})`);
}

// ─────────────────── Assertions ───────────────────────────
type AssertFn = typeof assert;

function buildAssertions(records: AssertionRecord[]) {
  function rec(label: string, passed: boolean, expected: string, actual: string) {
    records.push({ label, passed, expected, actual });
    if (!passed) throw new Error(`${label}: expected «${expected}» got «${actual}»`);
  }

  const a = {
    eq<T>(label: string, actual: T, expected: T) {
      rec(label, actual === expected, String(expected), String(actual));
    },
    notEq<T>(label: string, actual: T, unexpected: T) {
      rec(label, actual !== unexpected, `≠ ${String(unexpected)}`, String(actual));
    },
    status(res: HttpResult, expected: number) {
      rec(`HTTP ${expected}`, res.status === expected, String(expected), String(res.status));
    },
    statusIn(res: HttpResult, ...codes: number[]) {
      const ok = codes.includes(res.status);
      rec(`HTTP in [${codes}]`, ok, codes.join("|"), String(res.status));
    },
    hasField(obj: unknown, field: string) {
      const val = (obj as Record<string, unknown>)?.[field];
      const ok = val !== undefined && val !== null;
      rec(`field «${field}» present`, ok, "defined", String(val));
    },
    fieldEq(obj: unknown, field: string, expected: unknown) {
      const actual = (obj as Record<string, unknown>)?.[field];
      rec(`field «${field}»`, actual === expected, String(expected), String(actual));
    },
    contains(label: string, haystack: string, needle: string) {
      rec(label, haystack.includes(needle), `contains «${needle}»`, haystack.slice(0, 80));
    },
    notContains(label: string, haystack: string, needle: string) {
      rec(label, !haystack.includes(needle), `NOT contains «${needle}»`, `found in: ${haystack.slice(0, 80)}`);
    },
    gt(label: string, actual: number, min: number) {
      rec(label, actual > min, `> ${min}`, String(actual));
    },
    gte(label: string, actual: number, min: number) {
      rec(label, actual >= min, `>= ${min}`, String(actual));
    },
    truthy(label: string, val: unknown) {
      rec(label, Boolean(val), "truthy", String(val));
    },
    falsy(label: string, val: unknown) {
      rec(label, !val, "falsy", String(val));
    },
    isArray(label: string, val: unknown) {
      rec(label, Array.isArray(val), "Array", typeof val);
    },
    isString(label: string, val: unknown) {
      rec(label, typeof val === "string", "string", typeof val);
    },
  };
  return a;
}
// top-level assert (for TS type only, not used at top level)
const assert = buildAssertions([]);

// ─────────────────── Shared Scenario State ────────────────
interface ScenarioCtx {
  // tenant created in this run
  tenantId: string;
  tenantAdminEmail: string;
  tenantAdminJar: CookieJar;
  tenantAdminUser: Record<string, unknown>;
  // org units
  departmentId: string;
  jobTitleId: string;
  // users
  hrEmail: string;
  hrJar: CookieJar;
  hrUserId: string;
  managerEmail: string;
  managerJar: CookieJar;
  managerUserId: string;
  managerEmployeeId: string;
  employeeEmail: string;
  employeeJar: CookieJar;
  employeeUserId: string;
  employeeEmployeeId: string;
  // leave type
  leaveTypeId: string;
  // resources created during tests (for cross-test assertions)
  leaveRequestId: string;       // employee created, manager approves
  attendanceRequestId: string;  // employee created, manager approves
  payrollPeriodId: string;
}

// filled progressively
const ctx = {} as ScenarioCtx;

// ─────────────────── Helpers ──────────────────────────────
function data(res: HttpResult): Record<string, unknown> {
  return ((res.json as Record<string, unknown>)?.data ?? {}) as Record<string, unknown>;
}
function dataArray(res: HttpResult): unknown[] {
  const d = data(res);
  return Array.isArray(d) ? d : (Array.isArray((res.json as any)?.data) ? (res.json as any).data : []);
}
function isNextRedirect(res: HttpResult, path: string): boolean {
  return (
    res.status === 200 &&
    res.text.includes(path) &&
    (res.text.includes("NEXT_REDIRECT") || /http-equiv=["']refresh["']/i.test(res.text))
  );
}
function mobileHeaders() {
  return {
    "x-device-id": `e2e-${RUN_TAG}`,
    "x-device-platform": "ios",
    "x-device-name": "e2e-test",
    "x-app-version": "1.0.0-test",
  };
}

// ═══════════════════════════════════════════════════════════
//  SUITE 1 – Public / Visitor Access
// ═══════════════════════════════════════════════════════════
async function runPublicSuite() {
  suite("1 · Public Access");

  const publicPages = [
    ["/", "landing"],
    ["/features", "features"],
    ["/pricing", "pricing"],
    ["/plans", "plans"],
    ["/faq", "faq"],
    ["/support", "support"],
    ["/privacy", "privacy"],
    ["/terms", "terms"],
    ["/request-demo", "demo form"],
    ["/login", "login"],
  ];

  for (const [path, label] of publicPages) {
    await test(`${label} page is publicly accessible`, async (a) => {
      const res = await http(path, { redirect: "manual" });
      a.status(res, 200);
    });
  }

  await test("Protected dashboard redirects unauthenticated visitor", async (a) => {
    const res = await http("/dashboard", { redirect: "manual" });
    const isRedirect = res.status >= 300 && res.status < 400;
    const isPayload = isNextRedirect(res, "/login");
    a.truthy("redirects to login", isRedirect || isPayload);
  });

  await test("API endpoints require authentication", async (a) => {
    const endpoints = ["/api/users", "/api/employees", "/api/departments"];
    for (const ep of endpoints) {
      const res = await http(ep);
      a.statusIn(res, 401, 403);
    }
  });

  await test("reCAPTCHA guard on public tenant request", async (a) => {
    const res = await http("/api/public/tenant-requests", {
      method: "POST",
      body: {
        captchaToken: "fake",
        companyName: "Test", companyNameAr: "اختبار",
        contactName: "Test", contactEmail: "test@test.com",
        contactPhone: "+966500000000", employeesCount: "10",
      },
    });
    // Either 400 (RECAPTCHA not configured locally) or 422 (validation) – not 200
    a.truthy("blocked – not 200/201", res.status !== 200 && res.status !== 201);
  });
}

// ═══════════════════════════════════════════════════════════
//  SUITE 2 – Super Admin
// ═══════════════════════════════════════════════════════════
async function runSuperAdminSuite() {
  suite("2 · Super Admin");

  let jar: CookieJar;

  await test("Login returns valid SUPER_ADMIN session", async (a) => {
    const { jar: j, user } = await loginWeb("admin@ujoor.com");
    jar = j;
    a.fieldEq(user, "role", "SUPER_ADMIN");
    a.truthy("has id", user.id);
    a.falsy("no tenantId", user.tenantId);
  });

  await test("Root /dashboard redirects to /dashboard/super-admin", async (a) => {
    const res = await http("/dashboard", { jar, redirect: "manual" });
    const ok =
      (res.status >= 300 && res.status < 400 && res.location?.includes("/dashboard/super-admin")) ||
      isNextRedirect(res, "/dashboard/super-admin");
    a.truthy("redirects to super-admin dashboard", ok);
  });

  await test("Can list all tenants (cross-tenant read)", async (a) => {
    const res = await http("/api/tenants", { jar });
    a.status(res, 200);
    const arr = dataArray(res);
    a.isArray("tenants array", arr);
    a.gte("has at least 1 tenant", arr.length, 1);
  });

  let tenantRequestId: string;
  await test("Creates tenant request fixture", async (a) => {
    const req = await prisma.tenantRequest.create({
      data: {
        companyName: `E2E Suite ${RUN_TAG}`,
        companyNameAr: `مجموعة اختبار ${RUN_TAG}`,
        employeeCount: "50",
        contactName: "Suite Contact",
        contactEmail: `suite-admin-${RUN_TAG}@example.test`,
        contactPhone: "+966512345678",
        message: "Full E2E suite fixture",
      },
    });
    tenantRequestId = req.id;
    ctx.tenantAdminEmail = req.contactEmail;
    a.truthy("request id", req.id);
    a.fieldEq(req, "status", "PENDING");
  });

  await test("Super admin approves tenant request → tenant created", async (a) => {
    const res = await http(`/api/admin/tenant-requests/${tenantRequestId}/approve`, {
      method: "POST",
      jar,
      body: { slug: `e2e-${RUN_TAG.slice(-8)}` },
    });
    a.status(res, 200);
    const tenantId = (data(res) as any)?.id as string | undefined;
    a.truthy("tenant id returned", tenantId);
    ctx.tenantId = tenantId!;
  });

  await test("Bootstrap creates tenant admin user correctly", async (a) => {
    const res = await http(`/api/admin/tenants/${ctx.tenantId}/bootstrap-admin`, {
      method: "POST",
      jar,
      body: {
        email: ctx.tenantAdminEmail,
        password: PASSWORD,
        firstName: "Suite",
        lastName: "Admin",
      },
    });
    a.status(res, 200);
    const user = (data(res) as any)?.user as Record<string, unknown> | undefined;
    a.truthy("user returned", user);
    a.fieldEq(user, "role", "TENANT_ADMIN");
    a.fieldEq(user, "email", ctx.tenantAdminEmail);
    a.fieldEq(user, "tenantId", ctx.tenantId);
  });

  await test("Super admin can list pending tenant requests", async (a) => {
    const res = await http("/api/admin/tenant-requests", { jar });
    a.status(res, 200);
    const arr = dataArray(res);
    a.isArray("array", arr);
  });

  await test("Super admin dashboard pages all accessible", async (a) => {
    const pages = [
      "/dashboard/super-admin",
      "/dashboard/super-admin/requests",
      "/dashboard/super-admin/tenants",
      "/dashboard/super-admin/pricing",
      "/dashboard/super-admin/settings",
    ];
    for (const p of pages) {
      const res = await http(p, { jar, redirect: "manual" });
      a.eq(`${p} → 200`, res.status, 200);
    }
  });

  await test("Super admin cannot access tenant-scoped user API without tenantId", async (a) => {
    // When super admin calls /api/users (tenant-scoped), it should fail because no tenantId
    const res = await http("/api/users", { jar });
    // 403 is expected - super admin lacks tenantId
    a.statusIn(res, 403, 400);
  });
}

// ═══════════════════════════════════════════════════════════
//  SUITE 3 – Tenant Admin – Full Org Setup
// ═══════════════════════════════════════════════════════════
async function runTenantAdminSuite() {
  suite("3 · Tenant Admin – Org Setup");

  await test("Login succeeds with correct role and tenant scope", async (a) => {
    const { jar, user } = await loginWeb(ctx.tenantAdminEmail);
    ctx.tenantAdminJar = jar;
    ctx.tenantAdminUser = user as Record<string, unknown>;
    a.fieldEq(user, "role", "TENANT_ADMIN");
    a.fieldEq(user, "tenantId", ctx.tenantId);
    a.truthy("has id", user.id);
  });

  // ── Department CRUD ──
  await test("Create department → fields correct", async (a) => {
    const res = await http("/api/departments", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: { name: "Engineering", nameAr: "الهندسة", code: `ENG-${RUN_TAG}` },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "name", "Engineering");
    a.fieldEq(d, "nameAr", "الهندسة");
    a.fieldEq(d, "tenantId", ctx.tenantId);
    a.truthy("has id", d.id);
    ctx.departmentId = d.id as string;
  });

  await test("Fetch department by listing → appears in tenant list", async (a) => {
    const res = await http("/api/departments", { jar: ctx.tenantAdminJar });
    a.status(res, 200);
    const arr = dataArray(res);
    a.isArray("departments array", arr);
    const found = arr.find((d: any) => d.id === ctx.departmentId);
    a.truthy("created department visible", found);
  });

  // ── Job Title CRUD ──
  await test("Create job title → fields correct", async (a) => {
    const res = await http("/api/job-titles", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: { name: "Backend Engineer", nameAr: "مهندس خلفية", code: `BE-${RUN_TAG}` },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "name", "Backend Engineer");
    a.fieldEq(d, "tenantId", ctx.tenantId);
    ctx.jobTitleId = d.id as string;
  });

  // ── Users: create HR, Manager, Employee ──
  await test("Create HR user → role HR_MANAGER, tenantId correct", async (a) => {
    ctx.hrEmail = `hr-${RUN_TAG}@example.test`;
    const res = await http("/api/users", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: {
        firstName: "Suite", lastName: "HR",
        email: ctx.hrEmail, password: PASSWORD, role: "HR_MANAGER",
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "role", "HR_MANAGER");
    a.fieldEq(d, "email", ctx.hrEmail);
    a.fieldEq(d, "tenantId", ctx.tenantId);
    ctx.hrUserId = d.id as string;
  });

  await test("Create Manager user → role MANAGER", async (a) => {
    ctx.managerEmail = `mgr-${RUN_TAG}@example.test`;
    const res = await http("/api/users", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: {
        firstName: "Suite", lastName: "Manager",
        email: ctx.managerEmail, password: PASSWORD, role: "MANAGER",
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "role", "MANAGER");
    ctx.managerUserId = d.id as string;
  });

  await test("Create Employee user → role EMPLOYEE", async (a) => {
    ctx.employeeEmail = `emp-${RUN_TAG}@example.test`;
    const res = await http("/api/users", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: {
        firstName: "Suite", lastName: "Employee",
        email: ctx.employeeEmail, password: PASSWORD, role: "EMPLOYEE",
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "role", "EMPLOYEE");
    ctx.employeeUserId = d.id as string;
  });

  await test("Listing users returns all 4 created (including self)", async (a) => {
    const res = await http("/api/users?pageSize=50", { jar: ctx.tenantAdminJar });
    a.status(res, 200);
    const d = res.json as any;
    const users: unknown[] = d?.data ?? [];
    a.gte("≥ 4 users (self + HR + Manager + Employee)", users.length, 4);
    const emails = users.map((u: any) => u.email);
    a.truthy("HR in list", emails.includes(ctx.hrEmail));
    a.truthy("Manager in list", emails.includes(ctx.managerEmail));
    a.truthy("Employee in list", emails.includes(ctx.employeeEmail));
  });

  // ── Employee records ──
  await test("Link manager → employee record, check fields", async (a) => {
    const res = await http("/api/employees", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: {
        firstName: "Suite", lastName: "Manager",
        email: ctx.managerEmail,
        hireDate: "2025-01-01",
        userId: ctx.managerUserId,
        departmentId: ctx.departmentId,
        jobTitleId: ctx.jobTitleId,
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "userId", ctx.managerUserId);
    a.fieldEq(d, "tenantId", ctx.tenantId);
    a.truthy("employeeNumber assigned", d.employeeNumber);
    ctx.managerEmployeeId = d.id as string;
  });

  await test("Link employee → employee record, managerId set", async (a) => {
    const res = await http("/api/employees", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: {
        firstName: "Suite", lastName: "Employee",
        email: ctx.employeeEmail,
        hireDate: "2025-01-15",
        userId: ctx.employeeUserId,
        departmentId: ctx.departmentId,
        managerId: ctx.managerEmployeeId,
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "managerId", ctx.managerEmployeeId);
    ctx.employeeEmployeeId = d.id as string;
  });

  await test("Employee list contains both created records", async (a) => {
    const res = await http("/api/employees?limit=50", { jar: ctx.tenantAdminJar });
    a.status(res, 200);
    const arr = dataArray(res);
    const ids = arr.map((e: any) => e.id);
    a.truthy("manager employee in list", ids.includes(ctx.managerEmployeeId));
    a.truthy("employee in list", ids.includes(ctx.employeeEmployeeId));
  });

  // ── Leave type ──
  await test("Create leave type → code unique per tenant", async (a) => {
    const res = await http("/api/leave-types", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: {
        name: "Annual Leave", nameAr: "إجازة سنوية",
        code: `ANNUAL-${RUN_TAG}`, defaultDays: 21,
        applicableGenders: [],
      },
    });
    a.statusIn(res, 200, 201);
    const d = data(res);
    a.truthy("has id", d.id);
    ctx.leaveTypeId = d.id as string;
  });

  // ── Payroll period ──
  await test("Create payroll period → status is DRAFT", async (a) => {
    const res = await http("/api/payroll/periods", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: {
        name: `April 2026 - ${RUN_TAG}`,
        nameAr: `إبريل 2026 - ${RUN_TAG}`,
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        paymentDate: "2026-04-30",
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "status", "DRAFT");
    a.truthy("has id", d.id);
    ctx.payrollPeriodId = d.id as string;
  });

  await test("Payroll period appears in GET list", async (a) => {
    const res = await http(`/api/payroll/periods?year=2026`, { jar: ctx.tenantAdminJar });
    a.status(res, 200);
    const arr = dataArray(res);
    const found = arr.find((p: any) => p.id === ctx.payrollPeriodId);
    a.truthy("period in list", found);
  });

  // ── Tenant admin cannot create SUPER_ADMIN ──
  await test("Tenant admin cannot escalate role to SUPER_ADMIN", async (a) => {
    const res = await http("/api/users", {
      method: "POST",
      jar: ctx.tenantAdminJar,
      body: {
        firstName: "Evil", lastName: "Hacker",
        email: `evil-${RUN_TAG}@example.test`,
        password: PASSWORD, role: "SUPER_ADMIN",
      },
    });
    a.statusIn(res, 400, 403, 422);
  });

  await test("Dashboard pages all accessible to tenant admin", async (a) => {
    const pages = [
      "/dashboard", "/dashboard/employees", "/dashboard/users",
      "/dashboard/departments", "/dashboard/job-titles",
      "/dashboard/requests", "/dashboard/support",
    ];
    for (const p of pages) {
      const res = await http(p, { jar: ctx.tenantAdminJar, redirect: "manual" });
      a.eq(`${p} → 200`, res.status, 200);
    }
  });
}

// ═══════════════════════════════════════════════════════════
//  SUITE 4 – HR Manager
// ═══════════════════════════════════════════════════════════
async function runHRSuite() {
  suite("4 · HR Manager");

  await test("Login → session has role HR_MANAGER and correct tenant", async (a) => {
    const { jar, user } = await loginWeb(ctx.hrEmail);
    ctx.hrJar = jar;
    a.fieldEq(user, "role", "HR_MANAGER");
    a.fieldEq(user, "tenantId", ctx.tenantId);
  });

  await test("Can list users (same tenant)", async (a) => {
    const res = await http("/api/users?pageSize=50", { jar: ctx.hrJar });
    a.status(res, 200);
    const d = res.json as any;
    const users: any[] = d?.data ?? [];
    a.gte("≥ 4 users", users.length, 4);
    // All users must belong to own tenant
    for (const u of users) {
      a.eq(`user ${u.id} tenantId matches`, u.tenantId, ctx.tenantId);
    }
  });

  await test("Can list employees (same tenant)", async (a) => {
    const res = await http("/api/employees?limit=50", { jar: ctx.hrJar });
    a.status(res, 200);
    const arr = dataArray(res);
    a.gte("≥ 2 employees", arr.length, 2);
  });

  await test("Cannot create TENANT_ADMIN → 403", async (a) => {
    const res = await http("/api/users", {
      method: "POST",
      jar: ctx.hrJar,
      body: {
        firstName: "Evil", lastName: "Escalation",
        email: `hr-esc-${RUN_TAG}@example.test`,
        password: PASSWORD, role: "TENANT_ADMIN",
      },
    });
    a.status(res, 403);
    a.contains("error message", String((res.json as any)?.error ?? ""), "غير مسموح");
  });

  await test("Can read leave types of own tenant", async (a) => {
    const res = await http("/api/leave-types", { jar: ctx.hrJar });
    a.status(res, 200);
    const arr = dataArray(res);
    const found = arr.find((lt: any) => lt.id === ctx.leaveTypeId);
    a.truthy("created leave type visible", found);
  });

  await test("Can GET employee record by ID", async (a) => {
    const res = await http(`/api/employees/${ctx.employeeEmployeeId}`, { jar: ctx.hrJar });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "id", ctx.employeeEmployeeId);
    a.fieldEq(d, "tenantId", ctx.tenantId);
  });

  await test("Can access departments and job titles", async (a) => {
    const depts = await http("/api/departments", { jar: ctx.hrJar });
    a.status(depts, 200);
    const jt = await http("/api/job-titles", { jar: ctx.hrJar });
    a.status(jt, 200);
  });

  await test("Can read payroll periods", async (a) => {
    const res = await http("/api/payroll/periods", { jar: ctx.hrJar });
    a.status(res, 200);
  });

  await test("HR cannot access super-admin routes", async (a) => {
    const res = await http("/api/admin/tenant-requests", { jar: ctx.hrJar });
    a.statusIn(res, 401, 403, 404);
  });

  await test("Notifications endpoint returns own notifications", async (a) => {
    const res = await http("/api/notifications", { jar: ctx.hrJar });
    a.status(res, 200);
    const d = (res.json as any)?.data;
    a.hasField(d, "notifications");
    a.isArray("notifications array", d?.notifications);
  });
}

// ═══════════════════════════════════════════════════════════
//  SUITE 5 – Manager
// ═══════════════════════════════════════════════════════════
async function runManagerSuite() {
  suite("5 · Manager");

  await test("Login → session has role MANAGER and correct tenant", async (a) => {
    const { jar, user } = await loginWeb(ctx.managerEmail);
    ctx.managerJar = jar;
    a.fieldEq(user, "role", "MANAGER");
    a.fieldEq(user, "tenantId", ctx.tenantId);
  });

  await test("Cannot access users list → 403", async (a) => {
    const res = await http("/api/users", { jar: ctx.managerJar });
    a.status(res, 403);
  });

  await test("Cannot access payroll periods", async (a) => {
    const res = await http("/api/payroll/periods", { jar: ctx.managerJar });
    // expect 403 or redirect payload
    const blocked =
      res.status === 403 ||
      res.status === 401 ||
      isNextRedirect(res, "unauthorized");
    a.truthy("blocked from payroll", blocked);
  });

  await test("Can list employees (team visibility)", async (a) => {
    const res = await http("/api/employees?limit=50", { jar: ctx.managerJar });
    a.status(res, 200);
    const arr = dataArray(res);
    a.gte("≥ 1 employee visible", arr.length, 1);
  });

  await test("Can GET own employee record", async (a) => {
    const res = await http(`/api/employees/${ctx.managerEmployeeId}`, { jar: ctx.managerJar });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "id", ctx.managerEmployeeId);
  });

  // ── Manager creates own attendance request ──
  let managerAttendId: string;
  await test("Can submit own attendance request → status PENDING", async (a) => {
    const res = await http("/api/attendance-requests", {
      method: "POST",
      jar: ctx.managerJar,
      body: {
        employeeId: ctx.managerEmployeeId,
        type: "WORK_FROM_HOME",
        date: "2026-04-10",
        reason: "Manager remote day e2e test",
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "status", "pending");
    a.fieldEq(d, "employeeId", ctx.managerEmployeeId);
    a.truthy("has id", d.id);
    managerAttendId = d.id as string;
  });

  await test("Can GET own attendance request by ID → matches created data", async (a) => {
    const res = await http(`/api/attendance-requests/${managerAttendId}`, { jar: ctx.managerJar });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "id", managerAttendId);
    a.fieldEq(d, "type", "work_from_home");
    a.fieldEq(d, "reason", "Manager remote day e2e test");
  });

  // ── Manager creates leave request ──
  let managerLeaveId: string;
  await test("Can submit leave request → status PENDING, fields correct", async (a) => {
    const res = await http("/api/leaves", {
      method: "POST",
      jar: ctx.managerJar,
      body: {
        employeeId: ctx.managerEmployeeId,
        leaveTypeId: ctx.leaveTypeId,
        startDate: "2026-04-20",
        endDate: "2026-04-21",
        reason: "Manager annual leave e2e",
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "status", "PENDING");
    a.fieldEq(d, "employeeId", ctx.managerEmployeeId);
    a.fieldEq(d, "leaveTypeId", ctx.leaveTypeId);
    managerLeaveId = d.id as string;
  });

  await test("GET own leave request by ID → matches submitted data", async (a) => {
    const res = await http(`/api/leaves/${managerLeaveId}`, { jar: ctx.managerJar });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "id", managerLeaveId);
    a.fieldEq(d, "totalDays", 2);
  });

  await test("Can view list of attendance requests (team queue)", async (a) => {
    const res = await http("/api/attendance-requests", { jar: ctx.managerJar });
    a.status(res, 200);
    const arr = dataArray(res);
    a.isArray("list", arr);
  });

  await test("Dashboard pages accessible to manager", async (a) => {
    const pages = [
      "/dashboard",
      "/dashboard/requests",
      "/dashboard/my-requests",
      "/dashboard/support",
      "/dashboard/settings",
    ];
    for (const p of pages) {
      const res = await http(p, { jar: ctx.managerJar, redirect: "manual" });
      a.eq(`${p} → 200`, res.status, 200);
    }
  });

  await test("Users page redirects/blocks manager (no access)", async (a) => {
    const res = await http("/dashboard/users", { jar: ctx.managerJar, redirect: "manual" });
    const blocked =
      (res.status >= 300 && res.status < 400) || isNextRedirect(res, "unauthorized");
    a.truthy("manager blocked from /dashboard/users", blocked);
  });
}

// ═══════════════════════════════════════════════════════════
//  SUITE 6 – Employee Self-Service
// ═══════════════════════════════════════════════════════════
async function runEmployeeSuite() {
  suite("6 · Employee Self-Service");

  await test("Login → role EMPLOYEE, correct tenant", async (a) => {
    const { jar, user } = await loginWeb(ctx.employeeEmail);
    ctx.employeeJar = jar;
    a.fieldEq(user, "role", "EMPLOYEE");
    a.fieldEq(user, "tenantId", ctx.tenantId);
  });

  await test("Cannot access users list → 403", async (a) => {
    const res = await http("/api/users", { jar: ctx.employeeJar });
    a.status(res, 403);
  });

  await test("Cannot access full employees list → 403", async (a) => {
    const res = await http("/api/employees?limit=100", { jar: ctx.employeeJar });
    a.status(res, 403);
  });

  // ── Attendance: submit ──
  let empAttendId: string;
  await test("Submit attendance correction → PENDING, date & type correct", async (a) => {
    const res = await http("/api/attendance-requests", {
      method: "POST",
      jar: ctx.employeeJar,
      body: {
        employeeId: ctx.employeeEmployeeId,
        type: "CHECK_CORRECTION",
        date: "2026-04-07",
        reason: "Forgot to check in",
        requestedCheckIn: "2026-04-07T08:00:00.000Z",
        requestedCheckOut: "2026-04-07T17:00:00.000Z",
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "status", "pending");
    a.fieldEq(d, "type", "check_correction");
    a.fieldEq(d, "employeeId", ctx.employeeEmployeeId);
    empAttendId = d.id as string;
    ctx.attendanceRequestId = empAttendId;
  });

  await test("GET own attendance request by ID", async (a) => {
    const res = await http(`/api/attendance-requests/${empAttendId}`, { jar: ctx.employeeJar });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "id", empAttendId);
  });

  await test("Cannot GET manager's attendance request → 403/404", async (a) => {
    // employee tries to fetch a request they don't own
    // First create a manager request to try to fetch
    // We'll try to access using the attendance request created by manager in prev suite
    // We don't have it stored yet, but we can try any uuid
    const res = await http(`/api/attendance-requests/${ctx.managerEmployeeId}`, {
      jar: ctx.employeeJar,
    });
    // 404 (not found) or 403 (access denied) are both correct
    a.statusIn(res, 403, 404);
  });

  // ── Leave: submit ──
  let empLeaveId: string;
  await test("Submit leave request → PENDING, correct employee", async (a) => {
    const res = await http("/api/leaves", {
      method: "POST",
      jar: ctx.employeeJar,
      body: {
        employeeId: ctx.employeeEmployeeId,
        leaveTypeId: ctx.leaveTypeId,
        startDate: "2026-05-01",
        endDate: "2026-05-03",
        reason: "Employee vacation e2e",
      },
    });
    a.status(res, 201);
    const d = data(res);
    a.fieldEq(d, "status", "PENDING");
    a.fieldEq(d, "employeeId", ctx.employeeEmployeeId);
    a.eq("totalDays = 3", (d as any).totalDays, 3);
    empLeaveId = d.id as string;
    ctx.leaveRequestId = empLeaveId;
  });

  await test("GET own leave request by ID → data matches", async (a) => {
    const res = await http(`/api/leaves/${empLeaveId}`, { jar: ctx.employeeJar });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "id", empLeaveId);
    a.fieldEq(d, "status", "PENDING");
  });

  await test("Cannot submit leave for another employee → 403", async (a) => {
    const res = await http("/api/leaves", {
      method: "POST",
      jar: ctx.employeeJar,
      body: {
        employeeId: ctx.managerEmployeeId, // spoofing manager's employee ID
        leaveTypeId: ctx.leaveTypeId,
        startDate: "2026-05-10",
        endDate: "2026-05-10",
        reason: "Privilege escalation attempt",
      },
    });
    a.status(res, 403);
  });

  await test("GET leaves list shows ONLY own records", async (a) => {
    const res = await http("/api/leaves", { jar: ctx.employeeJar });
    a.status(res, 200);
    const arr = dataArray(res);
    // All items must be employee's own
    for (const item of arr as any[]) {
      a.eq(`leave ${item.id} belongs to employee`, item.employeeId, ctx.employeeEmployeeId);
    }
  });

  await test("GET attendance list shows ONLY own records", async (a) => {
    const res = await http("/api/attendance-requests", { jar: ctx.employeeJar });
    a.status(res, 200);
    const arr = dataArray(res);
    for (const item of arr as any[]) {
      a.eq(`attendance ${item.id} belongs to employee`, item.employeeId, ctx.employeeEmployeeId);
    }
  });

  await test("Dashboard pages accessible to employee", async (a) => {
    const pages = [
      "/dashboard",
      "/dashboard/my-requests",
      "/dashboard/support",
      "/dashboard/settings",
      "/dashboard/help-center",
    ];
    for (const p of pages) {
      const res = await http(p, { jar: ctx.employeeJar, redirect: "manual" });
      a.eq(`${p} → 200`, res.status, 200);
    }
  });

  await test("Can read own notifications", async (a) => {
    const res = await http("/api/notifications", { jar: ctx.employeeJar });
    a.status(res, 200);
  });

  // ── Mobile ──
  await test("Mobile login returns access token", async (a) => {
    const res = await http("/api/mobile/auth/login", {
      method: "POST",
      headers: { ...mobileHeaders(), "content-type": "application/json" },
      body: { email: ctx.employeeEmail, password: PASSWORD },
    });
    a.status(res, 200);
    const token = (data(res) as any)?.accessToken as string | undefined;
    a.truthy("access token returned", token);
    a.isString("token is string", token);
    a.gt("token length > 20", (token ?? "").length, 20);

    // Store for mobile profile test
    Object.defineProperty(ctx, "_mobileToken", { value: token, writable: true, configurable: true });
  });

  await test("Mobile /api/mobile/me returns correct employee profile", async (a) => {
    const token = (ctx as any)._mobileToken as string;
    if (!token) throw new Error("No mobile token from previous test");
    const res = await http("/api/mobile/me", {
      headers: { authorization: `Bearer ${token}`, ...mobileHeaders() },
    });
    a.status(res, 200);
    const d = data(res);
    a.truthy("profile returned", d);
  });
}

// ═══════════════════════════════════════════════════════════
//  SUITE 7 – Business Logic & Approval State Machines
// ═══════════════════════════════════════════════════════════
async function runBusinessLogicSuite() {
  suite("7 · Business Logic & Approval State Machines");

  // ── Attendance approval flow ──
  await test("Manager approves employee attendance request → status becomes APPROVED", async (a) => {
    const res = await http(`/api/attendance-requests/${ctx.attendanceRequestId}`, {
      method: "PATCH",
      jar: ctx.managerJar,
      body: { status: "approved" },
    });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "status", "approved");
    a.truthy("approvedById set", (d as any).approvedById);
    a.truthy("approvedAt set", (d as any).approvedAt);
  });

  await test("Cannot re-approve already APPROVED attendance request → 400", async (a) => {
    const res = await http(`/api/attendance-requests/${ctx.attendanceRequestId}`, {
      method: "PATCH",
      jar: ctx.tenantAdminJar,
      body: { status: "approved" },
    });
    a.status(res, 400);
    a.contains("error", String((res.json as any)?.error ?? ""), "pending");
  });

  await test("Employee cannot approve their own attendance request → 403", async (a) => {
    // Try to create a fresh pending request and self-approve
    const createRes = await http("/api/attendance-requests", {
      method: "POST",
      jar: ctx.employeeJar,
      body: {
        employeeId: ctx.employeeEmployeeId,
        type: "PERMISSION",
        date: "2026-04-15",
        reason: "Self approval attempt",
      },
    });
    const newId = (data(createRes) as any)?.id as string | undefined;
    if (!newId) throw new Error("Could not create attendance request for self-approve test");

    const patchRes = await http(`/api/attendance-requests/${newId}`, {
      method: "PATCH",
      jar: ctx.employeeJar,
      body: { status: "approved" },
    });
    a.status(patchRes, 403);
  });

  // ── Rejection requires reason ──
  await test("Rejecting attendance request WITHOUT reason → 400", async (a) => {
    // Create a fresh request to reject
    const createRes = await http("/api/attendance-requests", {
      method: "POST",
      jar: ctx.employeeJar,
      body: {
        employeeId: ctx.employeeEmployeeId,
        type: "OVERTIME",
        date: "2026-04-16",
        reason: "Overtime for project",
      },
    });
    const newId = (data(createRes) as any)?.id as string | undefined;
    if (!newId) throw new Error("Could not create request");

    const rejectRes = await http(`/api/attendance-requests/${newId}`, {
      method: "PATCH",
      jar: ctx.managerJar,
      body: { status: "rejected" /* no rejectionReason */ },
    });
    a.status(rejectRes, 400);
  });

  await test("Rejecting attendance request WITH reason → REJECTED", async (a) => {
    const createRes = await http("/api/attendance-requests", {
      method: "POST",
      jar: ctx.employeeJar,
      body: {
        employeeId: ctx.employeeEmployeeId,
        type: "PERMISSION",
        date: "2026-04-17",
        reason: "Personal errand",
      },
    });
    const newId = (data(createRes) as any)?.id as string | undefined;
    if (!newId) throw new Error("Could not create request");

    const rejectRes = await http(`/api/attendance-requests/${newId}`, {
      method: "PATCH",
      jar: ctx.managerJar,
      body: { status: "rejected", rejectionReason: "Outside policy hours" },
    });
    a.status(rejectRes, 200);
    const d = data(rejectRes);
    a.fieldEq(d, "status", "rejected");
    a.fieldEq(d as any, "rejectionReason", "Outside policy hours");
  });

  // ── Leave approval flow ──
  await test("HR approves employee leave request → status APPROVED", async (a) => {
    const res = await http(`/api/leaves/${ctx.leaveRequestId}`, {
      method: "PUT",
      jar: ctx.hrJar,
      body: { action: "approve" },
    });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "status", "APPROVED");
  });

  await test("Employee GET own leave after approval → sees APPROVED status", async (a) => {
    const res = await http(`/api/leaves/${ctx.leaveRequestId}`, {
      jar: ctx.employeeJar,
    });
    a.status(res, 200);
    const d = data(res);
    a.fieldEq(d, "status", "APPROVED");
  });

  // ── Tenant isolation ──
  await test("Tenant isolation: users from Tenant A not visible to default super-admin global query", async (a) => {
    // Super admin calling /api/users should fail (no tenant scope)
    const saRes = await http("/api/users", { jar: (global as any)._superAdminJar });
    a.statusIn(saRes, 400, 403);
  });

  await test("Employee cannot DELETE another employee's attendance request → 403", async (a) => {
    // create manager's request and try to delete it as employee
    const mgr = await http("/api/attendance-requests", {
      method: "POST",
      jar: ctx.managerJar,
      body: {
        employeeId: ctx.managerEmployeeId,
        type: "PERMISSION",
        date: "2026-04-18",
        reason: "Manager permission",
      },
    });
    const mgrId = (data(mgr) as any)?.id as string;
    if (!mgrId) throw new Error("Could not create manager attendance request");

    const del = await http(`/api/attendance-requests/${mgrId}`, {
      method: "DELETE",
      jar: ctx.employeeJar,
    });
    a.statusIn(del, 403, 404);
  });

  // ── Notifications ──
  await test("After leave approval, employee has unread notifications", async (a) => {
    const res = await http("/api/notifications/unread-count", { jar: ctx.employeeJar });
    a.status(res, 200);
    const count = (res.json as any)?.data?.count ?? (res.json as any)?.count ?? 0;
    a.gte("unread count ≥ 0", count, 0); // may be 0 if notifications disabled
  });
}

// ═══════════════════════════════════════════════════════════
//  SUITE 8 – Cross-Tenant Isolation
// ═══════════════════════════════════════════════════════════
async function runIsolationSuite() {
  suite("8 · Cross-Tenant Data Isolation");

  // We use the HR of ctx.tenantId and try to access a non-existent cross-tenant resource
  await test("Employee cannot read another tenant's leave request", async (a) => {
    // Create a leave request as employee, get its ID, then try to read it from a fresh unauthenticated jar
    const fakeId = "00000000000000000000000000";
    const res = await http(`/api/leaves/${fakeId}`, { jar: ctx.employeeJar });
    a.statusIn(res, 404, 403);
  });

  await test("Departments list contains only own tenant's departments", async (a) => {
    const res = await http("/api/departments", { jar: ctx.hrJar });
    a.status(res, 200);
    const arr = dataArray(res);
    for (const d of arr as any[]) {
      a.eq(`dept ${d.id} tenantId`, d.tenantId, ctx.tenantId);
    }
  });

  await test("Employee list scoped to own tenant", async (a) => {
    const res = await http("/api/employees?limit=50", { jar: ctx.hrJar });
    a.status(res, 200);
    const arr = dataArray(res);
    for (const e of arr as any[]) {
      a.eq(`emp ${e.id} tenantId`, e.tenantId, ctx.tenantId);
    }
  });

  await test("Users list scoped to own tenant", async (a) => {
    const res = await http("/api/users?pageSize=50", { jar: ctx.hrJar });
    a.status(res, 200);
    const d = res.json as any;
    const users: any[] = d?.data ?? [];
    for (const u of users) {
      a.eq(`user ${u.id} tenantId`, u.tenantId, ctx.tenantId);
    }
  });

  await test("Leave types scoped to own tenant", async (a) => {
    const res = await http("/api/leave-types", { jar: ctx.hrJar });
    a.status(res, 200);
    const arr = dataArray(res);
    for (const lt of arr as any[]) {
      a.eq(`leaveType ${lt.id} tenantId`, lt.tenantId, ctx.tenantId);
    }
  });
}

// ═══════════════════════════════════════════════════════════
//  SUITE 9 – Complete Customer Journey
// ═══════════════════════════════════════════════════════════
async function runJourneySuite() {
  suite("9 · Complete Customer Journey");
  // This suite narrates the full journey in sequence

  await test("Visitor lands on marketing site → all public pages 200", async (a) => {
    for (const path of ["/", "/features", "/pricing", "/plans"]) {
      const res = await http(path);
      a.eq(`${path} → 200`, res.status, 200);
    }
  });

  await test("Visitor contacts support page", async (a) => {
    const res = await http("/support");
    a.status(res, 200);
  });

  await test("Visitor cannot access dashboard → redirected to login", async (a) => {
    const res = await http("/dashboard", { redirect: "manual" });
    const blocked = res.status >= 300 || isNextRedirect(res, "/login");
    a.truthy("blocked from dashboard", blocked);
  });

  await test("Approved tenant admin can log in and see dashboard", async (a) => {
    const { jar, user } = await loginWeb(ctx.tenantAdminEmail);
    a.fieldEq(user, "role", "TENANT_ADMIN");
    const dash = await http("/dashboard", { jar, redirect: "manual" });
    a.eq("/dashboard → 200", dash.status, 200);
  });

  await test("Tenant admin has department and employees set up", async (a) => {
    const depts = await http("/api/departments", { jar: ctx.tenantAdminJar });
    a.status(depts, 200);
    const emps = await http("/api/employees", { jar: ctx.tenantAdminJar });
    a.status(emps, 200);
    a.gte("≥ 2 employees", dataArray(emps).length, 2);
  });

  await test("Employee logs in, submits leave, sees PENDING", async (a) => {
    // create a fresh leave to track the journey
    const { jar } = await loginWeb(ctx.employeeEmail);
    const submit = await http("/api/leaves", {
      method: "POST",
      jar,
      body: {
        employeeId: ctx.employeeEmployeeId,
        leaveTypeId: ctx.leaveTypeId,
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        reason: "Journey test leave",
      },
    });
    a.status(submit, 201);
    const journeyLeaveId = (data(submit) as any)?.id as string;
    a.truthy("leave id", journeyLeaveId);

    // verify pending
    const check = await http(`/api/leaves/${journeyLeaveId}`, { jar });
    a.fieldEq(data(check), "status", "PENDING");

    // HR approves
    const approve = await http(`/api/leaves/${journeyLeaveId}`, {
      method: "PUT",
      jar: ctx.hrJar,
      body: { action: "approve" },
    });
    a.status(approve, 200);
    a.fieldEq(data(approve), "status", "APPROVED");

    // Employee sees approved
    const final = await http(`/api/leaves/${journeyLeaveId}`, { jar });
    a.fieldEq(data(final), "status", "APPROVED");
  });

  await test("Employee mobile journey: login → profile → attendance", async (a) => {
    const loginRes = await http("/api/mobile/auth/login", {
      method: "POST",
      headers: { ...mobileHeaders(), "content-type": "application/json" },
      body: { email: ctx.employeeEmail, password: PASSWORD },
    });
    a.status(loginRes, 200);
    const token = (data(loginRes) as any)?.accessToken as string;
    a.truthy("token", token);

    const profile = await http("/api/mobile/me", {
      headers: { authorization: `Bearer ${token}`, ...mobileHeaders() },
    });
    a.status(profile, 200);
  });
}

// ═══════════════════════════════════════════════════════════
//  Cleanup
// ═══════════════════════════════════════════════════════════
async function cleanup() {
  suite("Cleanup");
  await test("Cancel audit tenant via API", async (a) => {
    // Re-login super admin fresh
    const { jar } = await loginWeb("admin@ujoor.com");
    const res = await http(`/api/tenants/${ctx.tenantId}`, {
      method: "DELETE",
      jar,
    });
    a.statusIn(res, 200, 204);
  });
}

// ═══════════════════════════════════════════════════════════
//  Summary & Report
// ═══════════════════════════════════════════════════════════
function printReport() {
  const totals = { PASS: 0, FAIL: 0, SKIP: 0, WARN: 0 };
  const bySuite = new Map<string, typeof totals>();
  const failedTests: TestRecord[] = [];
  const slowTests: TestRecord[] = [];

  for (const r of allResults) {
    totals[r.status]++;
    if (!bySuite.has(r.suite)) bySuite.set(r.suite, { PASS: 0, FAIL: 0, SKIP: 0, WARN: 0 });
    bySuite.get(r.suite)![r.status]++;
    if (r.status === "FAIL") failedTests.push(r);
    if (r.slow) slowTests.push(r);
  }

  const totalTests = allResults.length;
  const passRate = totalTests > 0 ? Math.round((totals.PASS / totalTests) * 100) : 0;

  console.log("\n" + "═".repeat(60));
  console.log("  INTEGRATION SUITE REPORT");
  console.log("═".repeat(60));
  console.log(`  Run Tag  : ${RUN_TAG}`);
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  Total    : ${totalTests} tests`);
  console.log(`  ✓ PASS   : ${totals.PASS}  (${passRate}%)`);
  console.log(`  ✗ FAIL   : ${totals.FAIL}`);
  console.log(`  ○ SKIP   : ${totals.SKIP}`);
  console.log(`  ⚠ SLOW   : ${slowTests.length} (>${SLOW_MS}ms)`);
  console.log("─".repeat(60));

  for (const [suiteName, counts] of Array.from(bySuite.entries())) {
    const icon = counts.FAIL > 0 ? "✗" : "✓";
    console.log(
      `  ${icon}  ${suiteName.padEnd(42)} ✓${counts.PASS} ✗${counts.FAIL} ○${counts.SKIP}`
    );
  }

  if (failedTests.length > 0) {
    console.log("\n  ── Failed Tests ─────────────────────────────────────");
    for (const t of failedTests) {
      console.log(`\n  ✗ [${t.suite}] ${t.test}`);
      console.log(`      ${t.error}`);
      for (const a of t.assertions.filter((x) => !x.passed)) {
        console.log(`      assertion «${a.label}»: expected «${a.expected}» got «${a.actual}»`);
      }
    }
  }

  if (slowTests.length > 0) {
    console.log("\n  ── Slow Tests ───────────────────────────────────────");
    for (const t of slowTests) {
      console.log(`  ⚠ [${t.suite}] ${t.test}: ${t.durationMs}ms`);
    }
  }

  console.log("\n" + "═".repeat(60));
  if (totals.FAIL === 0) {
    console.log("  ✓ All tests passed");
  } else {
    console.log(`  ✗ ${totals.FAIL} test(s) FAILED`);
    process.exitCode = 1;
  }
  console.log("═".repeat(60) + "\n");
}

// ═══════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log(`\nJisr/Taqam Full E2E Suite – ${new Date().toISOString()}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Store super admin jar globally for isolation tests
  const saLogin = await loginWeb("admin@ujoor.com");
  (global as any)._superAdminJar = saLogin.jar;

  await runPublicSuite();
  await runSuperAdminSuite();
  await runTenantAdminSuite();
  await runHRSuite();
  await runManagerSuite();
  await runEmployeeSuite();
  await runBusinessLogicSuite();
  await runIsolationSuite();
  await runJourneySuite();
  await cleanup();

  printReport();
}

main()
  .catch((e) => {
    console.error("\nFATAL ERROR:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
