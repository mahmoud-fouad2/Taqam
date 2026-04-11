/**
 * Payroll Periods API
 * GET /api/payroll/periods - List payroll periods
 * POST /api/payroll/periods - Create payroll period
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/api/route-helper";
import { mapPayrollPeriod } from "@/lib/payroll/periods";

const PAYROLL_ALLOWED_ROLES = ["TENANT_ADMIN", "HR_MANAGER"];

function parseDateInput(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { searchParams } = new URL(request.url);

    const yearRaw = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
    const monthRaw = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
    const status = searchParams.get("status") || undefined;

    const year =
      yearRaw !== undefined && Number.isFinite(yearRaw) && yearRaw >= 1900 && yearRaw <= 2200
        ? yearRaw
        : undefined;
    const month =
      monthRaw !== undefined && Number.isFinite(monthRaw) && monthRaw >= 1 && monthRaw <= 12
        ? monthRaw
        : undefined;

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
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({ data: periods.map(mapPayrollPeriod) });
  } catch (error) {
    console.error("Error fetching payroll periods:", error);
    return NextResponse.json({ error: "Failed to fetch payroll periods" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const body = await request.json();

    for (const key of ["name", "nameAr", "startDate", "endDate", "paymentDate"]) {
      if (!body?.[key]) {
        return NextResponse.json({ error: `${key} is required` }, { status: 400 });
      }
    }

    const startDate = parseDateInput(body.startDate);
    const endDate = parseDateInput(body.endDate);
    const paymentDate = parseDateInput(body.paymentDate);

    if (!startDate || !endDate || !paymentDate) {
      return NextResponse.json({ error: "Invalid payroll period dates" }, { status: 400 });
    }

    if (endDate < startDate) {
      return NextResponse.json({ error: "endDate must be on or after startDate" }, { status: 400 });
    }

    if (paymentDate < endDate) {
      return NextResponse.json(
        { error: "paymentDate must be on or after endDate" },
        { status: 400 }
      );
    }

    const period = await prisma.payrollPeriod.create({
      data: {
        tenantId,
        name: body.name,
        nameAr: body.nameAr,
        startDate,
        endDate,
        paymentDate,
        status: "DRAFT",
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeeCount: 0
      }
    });

    return NextResponse.json({ data: mapPayrollPeriod(period) }, { status: 201 });
  } catch (error) {
    console.error("Error creating payroll period:", error);
    return NextResponse.json({ error: "Failed to create payroll period" }, { status: 500 });
  }
}
