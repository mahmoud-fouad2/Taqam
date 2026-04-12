/**
 * Onboarding Process (single)
 * /api/recruitment/onboarding-processes/:id
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const { id } = await context.params;

    const p = await prisma.onboardingProcess.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            jobTitle: { select: { name: true } }
          }
        }
      }
    });

    if (!p) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: p.id,
        employeeId: p.employeeId,
        employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
        jobTitle: p.employee.jobTitle?.name ?? "",
        departmentName: p.employee.department?.name ?? "",
        startDate: p.startDate.toISOString(),
        mentor: undefined,
        status: mapStatus(p.status),
        progress: p.progress,
        tasks: (p.tasks as any) ?? [],
        documents: (p.documents as any) ?? [],
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }
    });
  } catch (error) {
    logApiError("Error fetching onboarding process", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch onboarding process" },
      { status: 500 }
    );
  }
}
