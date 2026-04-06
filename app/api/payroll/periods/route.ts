/**
 * Payroll Periods API
 * GET /api/payroll/periods - List payroll periods
 * POST /api/payroll/periods - Create payroll period
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireTenantSession } from "@/lib/api/route-helper";
import { mapPayrollPeriod } from "@/lib/payroll/periods";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId, session } = auth;

    const PAYROLL_READ_ROLES = ["TENANT_ADMIN", "HR_MANAGER"];
    if (!PAYROLL_READ_ROLES.includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = { tenantId };

    if (status) {
      where.status = String(status).toUpperCase();
    }

    if (year && month) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 0));
      where.startDate = { gte: start, lte: end };
    } else if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year, 11, 31));
      where.startDate = { gte: start, lte: end };
    }

    const periods = await prisma.payrollPeriod.findMany({
      where,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ data: periods.map(mapPayrollPeriod) });
  } catch (error) {
    console.error("Error fetching payroll periods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll periods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId, session } = auth;

    const PAYROLL_WRITE_ROLES = ["TENANT_ADMIN", "HR_MANAGER"];
    if (!PAYROLL_WRITE_ROLES.includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    for (const key of ["name", "nameAr", "startDate", "endDate", "paymentDate"]) {
      if (!body?.[key]) {
        return NextResponse.json({ error: `${key} is required` }, { status: 400 });
      }
    }

    const period = await prisma.payrollPeriod.create({
      data: {
        tenantId,
        name: body.name,
        nameAr: body.nameAr,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        paymentDate: new Date(body.paymentDate),
        status: "DRAFT",
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeeCount: 0,
      },
    });

    return NextResponse.json({ data: mapPayrollPeriod(period) }, { status: 201 });
  } catch (error) {
    console.error("Error creating payroll period:", error);
    return NextResponse.json(
      { error: "Failed to create payroll period" },
      { status: 500 }
    );
  }
}
