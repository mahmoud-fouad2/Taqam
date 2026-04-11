/**
 * Update onboarding task status
 * PATCH /api/recruitment/onboarding-processes/:id/tasks/:taskId
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OnboardingStatus } from "@prisma/client";

function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const { id, taskId } = await context.params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ success: false, error: "Missing status" }, { status: 400 });
    }

    const process = await prisma.onboardingProcess.findFirst({ where: { id, tenantId } });
    if (!process) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const tasks: any[] = Array.isArray(process.tasks)
      ? (process.tasks as any[])
      : ((process.tasks as any)?.tasks ?? []);
    const idx = tasks.findIndex((t) => String(t.id) === String(taskId));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    tasks[idx] = {
      ...tasks[idx],
      status: body.status,
      completedDate:
        body.status === "completed" ? new Date().toISOString() : tasks[idx]?.completedDate
    };

    const total = tasks.length || 0;
    const completed = tasks.filter((t) => t?.status === "completed").length;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    const status: OnboardingStatus =
      progress === 0
        ? OnboardingStatus.NOT_STARTED
        : progress === 100
          ? OnboardingStatus.COMPLETED
          : OnboardingStatus.IN_PROGRESS;

    const updated = await prisma.onboardingProcess.update({
      where: { id: process.id },
      data: {
        tasks,
        progress,
        status
      },
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

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        employeeId: updated.employeeId,
        employeeName: `${updated.employee.firstName} ${updated.employee.lastName}`,
        jobTitle: updated.employee.jobTitle?.name ?? "",
        departmentName: updated.employee.department?.name ?? "",
        startDate: updated.startDate.toISOString(),
        mentor: undefined,
        status: mapStatus(updated.status),
        progress: updated.progress,
        tasks: (updated.tasks as any) ?? [],
        documents: (updated.documents as any) ?? [],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error("Error updating onboarding task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update onboarding task" },
      { status: 500 }
    );
  }
}
