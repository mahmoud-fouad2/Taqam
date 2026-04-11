/**
 * Payroll Reports API (MVP)
 * GET /api/payroll/reports?year=YYYY&month=MM|all&departmentId=...|all
 *
 * Aggregates from PayrollPayslip snapshots.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getMonthName } from "@/lib/types/payroll";
import { requireTenantSession } from "@/lib/api/route-helper";
import { ensurePayslipsForPeriod } from "@/lib/payroll/payslips";
import { buildCsv } from "@/lib/payroll/export";

function monthKey(date: Date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function toNumber(v: any) {
  return typeof v === "number" ? v : Number(v);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { searchParams } = new URL(request.url);
    const yearRaw = searchParams.get("year") || "";
    const monthRaw = searchParams.get("month") || "all";
    const departmentId = searchParams.get("departmentId") || "all";
    const format = (searchParams.get("format") || "json").toLowerCase();

    const year = Number(yearRaw);
    if (!year || Number.isNaN(year)) {
      return NextResponse.json({ error: "year is required" }, { status: 400 });
    }

    const month = monthRaw === "all" ? undefined : Number(monthRaw);
    if (month !== undefined && (Number.isNaN(month) || month < 1 || month > 12)) {
      return NextResponse.json({ error: "month must be 1..12 or 'all'" }, { status: 400 });
    }

    const wherePeriods: any = { tenantId };

    if (month) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 0));
      wherePeriods.startDate = { gte: start, lte: end };
    } else {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year, 11, 31));
      wherePeriods.startDate = { gte: start, lte: end };
    }

    const periods = await prisma.payrollPeriod.findMany({
      where: wherePeriods,
      select: { id: true, startDate: true }
    });

    const periodIds = periods.map((p) => p.id);

    // Generate payslips snapshots if missing (idempotent)
    await Promise.all(periodIds.map((pid) => ensurePayslipsForPeriod(tenantId, pid)));

    const payslips = periodIds.length
      ? await prisma.payrollPayslip.findMany({
          where: {
            tenantId,
            payrollPeriodId: { in: periodIds },
            ...(departmentId !== "all"
              ? {
                  employee: {
                    departmentId
                  }
                }
              : {})
          },
          include: {
            payrollPeriod: { select: { startDate: true } },
            employee: {
              select: {
                departmentId: true,
                department: { select: { id: true, name: true, nameAr: true } }
              }
            }
          }
        })
      : [];

    // Department aggregation
    const byDept = new Map<
      string,
      {
        id: string;
        name: string;
        employeeCount: number;
        totalGross: number;
        totalDeductions: number;
        totalNet: number;
        gosiBase: number;
        gosiEmployee: number;
        gosiEmployer: number;
      }
    >();

    for (const p of payslips) {
      const dept = p.employee.department;
      const deptId = dept?.id || "no-dept";
      const deptName = dept?.nameAr || dept?.name || "غير محدد";

      const current = byDept.get(deptId) || {
        id: deptId,
        name: deptName,
        employeeCount: 0,
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        gosiBase: 0,
        gosiEmployee: 0,
        gosiEmployer: 0
      };

      current.employeeCount += 1;
      current.totalGross += toNumber(p.totalEarnings);
      current.totalDeductions += toNumber(p.totalDeductions);
      current.totalNet += toNumber(p.netSalary);

      const basicSalary = toNumber(p.basicSalary);
      current.gosiBase += basicSalary * 1.25;
      current.gosiEmployee += p.gosiEmployee;
      current.gosiEmployer += p.gosiEmployer;

      byDept.set(deptId, current);
    }

    const departmentStats = Array.from(byDept.values())
      .map((d) => ({
        ...d,
        avgSalary: d.employeeCount ? d.totalGross / d.employeeCount : 0
      }))
      .sort((a, b) => b.totalGross - a.totalGross);

    // Monthly trend (last 6 months ending at selected month/year, or current month in the selected year)
    const endMonth = month ?? Math.min(12, Math.max(1, new Date().getUTCMonth() + 1));
    const endDate = new Date(Date.UTC(year, endMonth - 1, 1));

    const months: Array<{ y: number; m: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() - i, 1));
      months.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 });
    }

    const byMonth = new Map<
      string,
      { month: string; totalGross: number; totalNet: number; employeeCount: number }
    >();

    for (const { y, m } of months) {
      const label = `${getMonthName(m, "ar")} ${y}`;
      byMonth.set(`${y}-${String(m).padStart(2, "0")}`, {
        month: label,
        totalGross: 0,
        totalNet: 0,
        employeeCount: 0
      });
    }

    for (const p of payslips) {
      const key = monthKey(p.payrollPeriod.startDate);
      const bucket = byMonth.get(key);
      if (!bucket) continue;

      bucket.totalGross += toNumber(p.totalEarnings);
      bucket.totalNet += toNumber(p.netSalary);
      bucket.employeeCount += 1;
    }

    const monthlyTrend = months.map(
      ({ y, m }) => byMonth.get(`${y}-${String(m).padStart(2, "0")}`)!
    );

    if (format === "csv") {
      const csv = buildCsv(
        [
          "section",
          "name",
          "employeeCount",
          "totalGross",
          "totalDeductions",
          "totalNet",
          "avgSalary",
          "gosiBase",
          "gosiEmployee",
          "gosiEmployer"
        ],
        [
          ...departmentStats.map((item) => [
            "department",
            item.name,
            item.employeeCount,
            item.totalGross,
            item.totalDeductions,
            item.totalNet,
            item.avgSalary,
            item.gosiBase,
            item.gosiEmployee,
            item.gosiEmployer
          ]),
          ...monthlyTrend.map((item) => [
            "trend",
            item.month,
            item.employeeCount,
            item.totalGross,
            undefined,
            item.totalNet,
            undefined,
            undefined,
            undefined,
            undefined
          ])
        ]
      );

      return new NextResponse(`\ufeff${csv}`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="payroll-report-${year}-${monthRaw}.csv"`
        }
      });
    }

    return NextResponse.json({
      data: {
        departmentStats,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error("Error generating payroll report:", error);
    return NextResponse.json({ error: "Failed to generate payroll report" }, { status: 500 });
  }
}
