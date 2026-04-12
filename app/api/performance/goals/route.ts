import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function mapGoalStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

function mapGoalPriority(priority: string): string {
  return priority.toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== "all") {
      where.status = status.toUpperCase().replace(/-/g, "_");
    }

    const goals = await prisma.performanceGoal.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            department: { select: { name: true, nameAr: true } }
          }
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true
          }
        }
      }
    });

    return NextResponse.json({
      data: goals.map((g) => ({
        id: g.id,
        employeeId: g.employeeId,
        employeeName: `${g.employee.firstNameAr || g.employee.firstName} ${g.employee.lastNameAr || g.employee.lastName}`,
        employeeNumber: g.employee.employeeNumber,
        department: g.employee.department?.nameAr || g.employee.department?.name || "-",
        title: g.titleAr || g.title,
        titleEn: g.title,
        description: g.description,
        category: g.category,
        priority: mapGoalPriority(g.priority),
        status: mapGoalStatus(g.status),
        targetValue: g.targetValue ?? undefined,
        currentValue: g.currentValue ?? undefined,
        unit: g.unit ?? undefined,
        startDate: g.startDate.toISOString().split("T")[0],
        dueDate: g.dueDate.toISOString().split("T")[0],
        completedAt: g.completedAt ? g.completedAt.toISOString().split("T")[0] : undefined,
        progress: g.progress,
        managerId: g.managerId ?? undefined,
        managerName: g.manager
          ? `${g.manager.firstNameAr || g.manager.firstName} ${g.manager.lastNameAr || g.manager.lastName}`
          : undefined,
        notes: g.notes ?? undefined,
        createdAt: g.createdAt.toISOString()
      }))
    });
  } catch (error) {
    logApiError("Error fetching goals", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const body = await request.json();

    const goal = await prisma.performanceGoal.create({
      data: {
        tenantId,
        employeeId: body.employeeId,
        title: body.titleEn || body.title,
        titleAr: body.title,
        description: body.description,
        category: body.category || "performance",
        priority: (body.priority || "medium").toUpperCase(),
        status: "DRAFT",
        targetValue: body.targetValue || null,
        currentValue: body.currentValue || null,
        unit: body.unit || null,
        startDate: new Date(body.startDate),
        dueDate: new Date(body.dueDate),
        progress: body.progress || 0,
        managerId: body.managerId || null,
        notes: body.notes || null
      }
    });

    return NextResponse.json({ data: { id: goal.id } }, { status: 201 });
  } catch (error) {
    logApiError("Error creating goal", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
