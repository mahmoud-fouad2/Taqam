/**
 * Job Titles API Routes
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureTenantJobTitleCatalog } from "@/lib/hr/job-title-catalog";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ data: [] });
    }

    await ensureTenantJobTitleCatalog(tenantId);

    const jobTitles = await prisma.jobTitle.findMany({
      where: {
        tenantId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      },
      orderBy: [{ level: "asc" }, { name: "asc" }]
    });

    return NextResponse.json({ data: jobTitles });
  } catch (error) {
    logApiError("Error fetching job titles", error);
    return NextResponse.json({ error: "Failed to fetch job titles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Job titles are managed centrally by the platform" },
      { status: 403 }
    );
  } catch (error) {
    logApiError("Error creating job title", error);
    return NextResponse.json({ error: "Failed to create job title" }, { status: 500 });
  }
}
