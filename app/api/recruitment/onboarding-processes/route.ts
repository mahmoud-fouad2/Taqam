/**
 * Onboarding Processes API
 * /api/recruitment/onboarding-processes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OnboardingStatus, Prisma } from "@prisma/client";

function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

function parseOnboardingStatus(value: unknown): OnboardingStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in OnboardingStatus ? (normalized as OnboardingStatus) : undefined;
}

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

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const where: Prisma.OnboardingProcessWhereInput = { tenantId };
    if (statusParam) {
      const raw = statusParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const statuses: OnboardingStatus[] = [];
      const invalid: string[] = [];
      for (const value of raw) {
        const parsed = parseOnboardingStatus(value);
        if (!parsed) invalid.push(value);
        else statuses.push(parsed);
      }

      if (invalid.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${invalid.join(", ")}` },
          { status: 400 }
        );
      }

      if (statuses.length === 1) where.status = statuses[0];
      else if (statuses.length > 1) where.status = { in: statuses };
    }

    const processes = await prisma.onboardingProcess.findMany({
      where,
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
      },
      orderBy: { createdAt: "desc" }
    });

    const result = processes.map((p) => ({
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
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching onboarding processes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch onboarding processes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.employeeId) {
      return NextResponse.json({ success: false, error: "Missing employeeId" }, { status: 400 });
    }

    const employee = await prisma.employee.findFirst({
      where: { id: body.employeeId, tenantId },
      include: {
        department: { select: { name: true } },
        jobTitle: { select: { name: true } }
      }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const template = body.templateId
      ? await prisma.onboardingTemplate.findFirst({ where: { id: body.templateId, tenantId } })
      : null;

    const created = await prisma.onboardingProcess.create({
      data: {
        tenantId,
        employeeId: employee.id,
        templateId: template?.id ?? null,
        startDate: new Date(),
        status: "NOT_STARTED",
        progress: 0,
        tasks: (template?.tasks as any) ?? [],
        documents: (template?.documents as any) ?? [],
        createdById: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        jobTitle: employee.jobTitle?.name ?? "",
        departmentName: employee.department?.name ?? "",
        startDate: created.startDate.toISOString(),
        mentor: undefined,
        status: mapStatus(created.status),
        progress: created.progress,
        tasks: (created.tasks as any) ?? [],
        documents: (created.documents as any) ?? [],
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error("Error creating onboarding process:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create onboarding process" },
      { status: 500 }
    );
  }
}
