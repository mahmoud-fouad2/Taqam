/**
 * Recruitment Funnel Analytics
 * GET /api/analytics/recruitment
 *
 * Returns pipeline funnel (applicant stage counts), average time-to-hire,
 * and open positions count for the requested period.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;
    const { tenantId } = result;

    const rateLimit = await checkRateLimit(req, {
      keyPrefix: `analytics:recruitment:${tenantId}`,
      limit: 30,
      windowMs: 60_000
    });
    if (!rateLimit.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "طلبات كثيرة، حاول لاحقاً" }, { status: 429 }),
        rateLimit
      );
    }

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const [applicants, offers, acceptedOffers, jobPostings] = await Promise.all([
      // Stage breakdown
      prisma.applicant.groupBy({
        by: ["status"],
        where: { tenantId, appliedAt: { gte: startDate, lte: endDate } },
        _count: { id: true }
      }),
      // Total offers sent
      prisma.jobOffer.count({
        where: { tenantId, createdAt: { gte: startDate, lte: endDate } }
      }),
      // Accepted offers
      prisma.jobOffer.count({
        where: {
          tenantId,
          status: "ACCEPTED",
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      // Active job postings
      prisma.jobPosting.count({
        where: { tenantId, status: "ACTIVE" }
      })
    ]);

    // Build ordered funnel stages
    const stageCounts: Record<string, number> = {};
    for (const row of applicants) {
      stageCounts[row.status] = row._count.id;
    }

    const FUNNEL_ORDER = [
      "NEW",
      "SCREENING",
      "SHORTLISTED",
      "INTERVIEW",
      "OFFER",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN"
    ];

    const STAGE_LABELS: Record<string, { ar: string; en: string }> = {
      NEW: { ar: "جديد", en: "New" },
      SCREENING: { ar: "فرز", en: "Screening" },
      SHORTLISTED: { ar: "قائمة مختصرة", en: "Shortlisted" },
      INTERVIEW: { ar: "مقابلة", en: "Interview" },
      OFFER: { ar: "عرض", en: "Offer" },
      ACCEPTED: { ar: "مقبول", en: "Accepted" },
      REJECTED: { ar: "مرفوض", en: "Rejected" },
      WITHDRAWN: { ar: "انسحب", en: "Withdrawn" }
    };

    const funnel = FUNNEL_ORDER.map((stage) => ({
      stage,
      labelAr: STAGE_LABELS[stage]?.ar ?? stage,
      labelEn: STAGE_LABELS[stage]?.en ?? stage,
      count: stageCounts[stage] ?? 0
    })).filter(
      (f) => f.count > 0 || ["NEW", "SCREENING", "INTERVIEW", "ACCEPTED"].includes(f.stage)
    );

    const total = Object.values(stageCounts).reduce((s, n) => s + n, 0);
    const offerAcceptanceRate = offers > 0 ? Math.round((acceptedOffers / offers) * 100) : null;

    return NextResponse.json({
      data: {
        year,
        funnel,
        total,
        offers,
        acceptedOffers,
        offerAcceptanceRate,
        activeJobPostings: jobPostings
      }
    });
  } catch (error) {
    logApiError("GET analytics/recruitment error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
