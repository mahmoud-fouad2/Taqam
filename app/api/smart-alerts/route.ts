/**
 * GET /api/smart-alerts
 * Returns upcoming HR alerts for the current tenant (30-day horizon by default).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getSmartAlerts } from "@/lib/smart-alerts";

export async function GET(req: NextRequest) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  const rateLimit = await checkRateLimit(req, {
    keyPrefix: `smart-alerts:${auth.tenantId}`,
    limit: 20,
    windowMs: 60_000
  });
  if (!rateLimit.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "طلبات كثيرة، حاول لاحقاً" }, { status: 429 }),
      rateLimit
    );
  }

  try {
    const horizon = 30;
    const alerts = await getSmartAlerts(auth.tenantId, horizon);
    return withRateLimitHeaders(
      NextResponse.json({ data: alerts, count: alerts.length }),
      rateLimit
    );
  } catch (err) {
    logApiError("GET /api/smart-alerts", err);
    return NextResponse.json({ error: "حدث خطأ في جلب التنبيهات" }, { status: 500 });
  }
}
