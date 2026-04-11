/**
 * Dashboard Recent Activities API
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardActivities } from "@/lib/dashboard";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const activities = await getDashboardActivities({ tenantId, limit });

    return NextResponse.json({
      data: activities
    });
  } catch (error) {
    logger.error("Error fetching recent activities", undefined, error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
