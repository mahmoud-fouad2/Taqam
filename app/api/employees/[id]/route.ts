/**
 * Single Employee API Routes
 * GET /api/employees/[id] - Get employee
 * PUT /api/employees/[id] - Update employee
 * DELETE /api/employees/[id] - Delete employee
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        jobTitle: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        shift: true,
        salaryRecords: {
          orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Check tenant access
    if (session.user.tenantId && employee.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Verify employee exists and belongs to tenant
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (session.user.tenantId && existing.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        firstNameAr: body.firstNameAr,
        lastNameAr: body.lastNameAr,
        email: body.email,
        phone: body.phone,
        nationalId: body.nationalId,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender,
        nationality: body.nationality,
        maritalStatus: body.maritalStatus,
        address: body.address ?? undefined,
        emergencyContact: body.emergencyContact ?? undefined,
        departmentId: body.departmentId,
        jobTitleId: body.jobTitleId,
        managerId: body.managerId,
        employmentType: body.employmentType,
        status: body.status,
        shiftId: body.shiftId,
        workLocation: body.workLocation,
        baseSalary: body.baseSalary,
      },
      include: {
        department: true,
        jobTitle: true,
      },
    });

    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (session.user.tenantId && existing.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Two-step delete:
    // 1) First delete => soft terminate
    // 2) Second delete (already terminated) => hard delete
    if (existing.status === "TERMINATED") {
      await prisma.employee.delete({ where: { id } });
      return NextResponse.json({ success: true, mode: "hard" });
    }

    await prisma.employee.update({
      where: { id },
      data: {
        status: "TERMINATED",
        terminationDate: new Date(),
      },
    });

    return NextResponse.json({ success: true, mode: "soft" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
