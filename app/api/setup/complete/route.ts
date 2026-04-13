import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getSetupStatus, completeSetup, SETUP_TOTAL_STEPS } from "@/lib/setup";
import prisma from "@/lib/db";

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
      return NextResponse.json({ ok: true, alreadyComplete: true });
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

    await completeSetup(auth.tenantId);

    // Fire-and-forget audit log
    prisma.auditLog
      .create({
        data: {
          tenantId: auth.tenantId,
          userId: auth.session.user.id,
          action: "SETUP_COMPLETED",
          entity: "SetupWizard",
          entityId: auth.tenantId,
          newData: { completedAt: new Date().toISOString() }
        }
      })
      .catch(() => {});

    const completedAt = new Date().toISOString();
    return withRateLimitHeaders(
      NextResponse.json({ ok: true, completedAt }),
      rateLimit
    );
  } catch (err) {
    logApiError("POST /api/setup/complete", err);
    return NextResponse.json({ error: "حدث خطأ في إتمام الإعداد" }, { status: 500 });
  }
}
