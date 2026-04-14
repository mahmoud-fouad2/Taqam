import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import {
  getSetupStatus,
  completeSetup,
  ensureSetupCompletionArtifacts,
  logSetupCompletionAudit,
  SETUP_TOTAL_STEPS
} from "@/lib/setup";

function getRequestIpAddress(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

// POST /api/setup/complete — mark setup as done
export async function POST(req: NextRequest) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  const rateLimit = await checkRateLimit(req, {
    keyPrefix: `setup-complete:${auth.tenantId}`,
    limit: 10,
    windowMs: 30 * 60_000 // 10 per 30 min
  });
  if (!rateLimit.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "طلبات كثيرة، حاول لاحقاً" }, { status: 429 }),
      rateLimit
    );
  }

  try {
    const status = await getSetupStatus(auth.tenantId);

    if (status.isComplete) {
      await ensureSetupCompletionArtifacts(auth.tenantId, auth.session.user.id);
      return withRateLimitHeaders(
        NextResponse.json({ ok: true, alreadyComplete: true }),
        rateLimit
      );
    }

    if (status.currentStep < SETUP_TOTAL_STEPS) {
      return NextResponse.json(
        {
          error: "لم تكتمل جميع خطوات الإعداد بعد",
          currentStep: status.currentStep,
          totalSteps: SETUP_TOTAL_STEPS
        },
        { status: 400 }
      );
    }

    await completeSetup(auth.tenantId, auth.session.user.id);

    const completedStatus = await getSetupStatus(auth.tenantId);
    const completedAt = completedStatus.completedAt ?? new Date();

    await logSetupCompletionAudit({
      tenantId: auth.tenantId,
      userId: auth.session.user.id,
      previousStep: status.currentStep,
      completedAt,
      setupData: completedStatus.data,
      ipAddress: getRequestIpAddress(req),
      userAgent: req.headers.get("user-agent")
    }).catch(() => {});

    return withRateLimitHeaders(
      NextResponse.json({ ok: true, completedAt: completedAt.toISOString() }),
      rateLimit
    );
  } catch (err) {
    logApiError("POST /api/setup/complete", err);
    return NextResponse.json({ error: "حدث خطأ في إتمام الإعداد" }, { status: 500 });
  }
}
