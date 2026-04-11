/**
 * Dashboard Stats API
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const stats = await getDashboardStats(tenantId);

    return NextResponse.json({
      data: {
        ...stats
      }
    });
  } catch (error) {
    logger.error("Error fetching dashboard stats", undefined, error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
