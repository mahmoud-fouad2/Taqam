/**
 * Recruitment Stats API Route
 * /api/recruitment/stats
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const [activeJobs, totalApplications, scheduledInterviews, applicantsByStatus] =
      await Promise.all([
        prisma.jobPosting.count({
          where: { tenantId, status: "ACTIVE" }
        }),
        prisma.applicant.count({
          where: { tenantId }
        }),
        prisma.interview.count({
          where: { tenantId, status: "SCHEDULED" }
        }),
        prisma.applicant.groupBy({
          by: ["status"],
          where: { tenantId },
          _count: true
        })
      ]);

    const applicationsByStatus = applicantsByStatus.map((item) => ({
      status: item.status.toLowerCase().replace(/_/g, "-"),
      count: item._count,
      percentage: totalApplications > 0 ? Math.round((item._count / totalApplications) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        activeJobs,
        totalApplications,
        scheduledInterviews,
        applicationsByStatus
      }
    });
  } catch (error) {
    logApiError("Error fetching recruitment stats", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recruitment stats" },
      { status: 500 }
    );
  }
}
