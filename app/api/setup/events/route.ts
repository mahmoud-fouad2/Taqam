import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import prisma from "@/lib/db";
import {
  getSetupTrackedEventAuditAction,
  getSetupTrackedEventCompletionPercent,
  parseSetupTrackedEventInput
} from "@/lib/setup-events";

function getRequestIpAddress(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  const rateLimit = await checkRateLimit(req, {
    keyPrefix: `setup-events:${auth.tenantId}`,
    limit: 60,
    windowMs: 60_000
  });
  if (!rateLimit.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "طلبات كثيرة، حاول لاحقاً" }, { status: 429 }),
      rateLimit
    );
  }

  try {
    const parsed = parseSetupTrackedEventInput(await req.json().catch(() => ({})));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error, issues: parsed.issues }, { status: 422 });
    }

    const action = getSetupTrackedEventAuditAction(parsed.data.event);

    await prisma.auditLog.create({
      data: {
        tenantId: auth.tenantId,
        userId: auth.session.user.id,
        action,
        entity: "SetupWizard",
        entityId: auth.tenantId,
        newData: {
          ...parsed.data,
          completionPercent: getSetupTrackedEventCompletionPercent(parsed.data),
          source: "setup-wizard-client"
        },
        ipAddress: getRequestIpAddress(req),
        userAgent: req.headers.get("user-agent")
      }
    });

    return withRateLimitHeaders(NextResponse.json({ ok: true }), rateLimit);
  } catch (error) {
    logApiError("POST /api/setup/events", error);
    return NextResponse.json({ error: "حدث خطأ في تسجيل حدث التفعيل" }, { status: 500 });
  }
}
