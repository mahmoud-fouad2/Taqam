/**
 * Dashboard Charts Data API
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardCharts, type DashboardChartPeriod } from "@/lib/dashboard";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const rawPeriod = searchParams.get("period") || "week";
    const period: DashboardChartPeriod =
      rawPeriod === "month" || rawPeriod === "year" ? rawPeriod : "week";

    const chartData = await getDashboardCharts({ tenantId, period });

    return NextResponse.json({
      data: {
        ...chartData
      }
    });
  } catch (error) {
    logger.error("Error fetching chart data", undefined, error);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}
