/**
 * Analytics Overview API
 *
 * Returns tenant-scoped analytics for dashboard/analytics page.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";

type PeriodKey = "this-week" | "current-month" | "last-month" | "this-quarter" | "this-year";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(date: Date, weekStartDay: number) {
  // weekStartDay: 0=Sun .. 6=Sat
  const d = startOfDay(date);
  const currentDay = d.getDay();
  const diff = (currentDay - weekStartDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function getQuarterStart(date: Date) {
  const month = date.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

function parsePeriod(raw: string | null): PeriodKey {
  const v = (raw || "current-month") as PeriodKey;
  switch (v) {
    case "this-week":
    case "current-month":
    case "last-month":
    case "this-quarter":
    case "this-year":
      return v;
    default:
      return "current-month";
  }
}

function getRange(now: Date, period: PeriodKey, weekStartDay: number) {
  const end = endOfDay(now);

  if (period === "this-week") {
    const start = startOfWeek(now, weekStartDay);
    return { start, end };
  }

  if (period === "current-month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfDay(start), end };
  }

  if (period === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: startOfDay(start), end: endOfDay(endLastMonth) };
  }

  if (period === "this-quarter") {
    const start = getQuarterStart(now);
    return { start: startOfDay(start), end };
  }

  // this-year
  const start = new Date(now.getFullYear(), 0, 1);
  return { start: startOfDay(start), end };
}

function toNumber(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  // Prisma Decimal sometimes comes as { toString() }
  if (v && typeof v === "object" && "toString" in (v as any)) {
    return Number((v as any).toString());
  }
  return Number(v);
}

function ageFromDob(dob: Date, onDate: Date) {
  let age = onDate.getFullYear() - dob.getFullYear();
  const m = onDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && onDate.getDate() < dob.getDate())) age -= 1;
  return age;
}

function bucketAge(age: number) {
  if (age < 20) return "<20";
  if (age <= 29) return "20-29";
  if (age <= 39) return "30-39";
  if (age <= 49) return "40-49";
  return "50+";
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
    const period = parsePeriod(searchParams.get("period"));

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { currency: true, weekStartDay: true }
    });

    const currency = tenant?.currency || "SAR";
    const weekStartDay = typeof tenant?.weekStartDay === "number" ? tenant.weekStartDay : 0;

    const now = new Date();
    const range = getRange(now, period, weekStartDay);

    // HR analytics
    const [
      totalEmployees,
      newHires,
      terminations,
      departments,
      nationalityGroups,
      employmentTypeGroups,
      employeesForAge
    ] = await Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.employee.count({
        where: { tenantId, hireDate: { gte: range.start, lte: range.end } }
      }),
      prisma.employee.count({
        where: {
          tenantId,
          OR: [
            { terminationDate: { gte: range.start, lte: range.end } },
            {
              terminationDate: null,
              status: { in: ["TERMINATED", "RESIGNED"] },
              updatedAt: { gte: range.start, lte: range.end }
            }
          ]
        }
      }),
      prisma.department.findMany({
        where: { tenantId },
        include: { _count: { select: { employees: true } } },
        orderBy: { name: "asc" }
      }),
      prisma.employee.groupBy({
        by: ["nationality"],
        where: { tenantId, nationality: { not: null } },
        _count: { _all: true },
        orderBy: { nationality: "asc" }
      }),
      prisma.employee.groupBy({
        by: ["employmentType"],
        where: { tenantId },
        _count: { _all: true },
        orderBy: { employmentType: "asc" }
      }),
      prisma.employee.findMany({
        where: { tenantId, dateOfBirth: { not: null } },
        select: { dateOfBirth: true }
      })
    ]);

    const headcountByDepartment = departments
      .map((d) => ({
        department: d.nameAr || d.name,
        count: d._count.employees
      }))
      .filter((d) => d.count > 0);

    const headcountByNationality = nationalityGroups
      .map((g) => ({
        nationality: g.nationality || "غير محدد",
        count: g._count._all
      }))
      .filter((g) => g.count > 0);

    const employmentTypeDistribution = employmentTypeGroups
      .map((g) => ({
        type: g.employmentType,
        count: g._count._all
      }))
      .filter((g) => g.count > 0);

    const ageDistributionMap = new Map<string, number>();
    for (const e of employeesForAge) {
      if (!e.dateOfBirth) continue;
      const age = ageFromDob(e.dateOfBirth, now);
      const bucket = bucketAge(age);
      ageDistributionMap.set(bucket, (ageDistributionMap.get(bucket) || 0) + 1);
    }
    const bucketOrder = ["<20", "20-29", "30-39", "40-49", "50+"]; // stable UI
    const ageDistribution = bucketOrder
      .map((rangeLabel) => ({ range: rangeLabel, count: ageDistributionMap.get(rangeLabel) || 0 }))
      .filter((x) => x.count > 0);

    const turnoverRate =
      totalEmployees > 0 ? Number(((terminations / totalEmployees) * 100).toFixed(1)) : 0;

    // Attendance analytics
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        date: { gte: range.start, lte: range.end }
      },
      select: {
        status: true,
        overtimeMinutes: true,
        employee: {
          select: {
            department: { select: { name: true, nameAr: true } }
          }
        }
      }
    });

    let lateArrivals = 0;
    let absences = 0;
    let present = 0;
    let overtimeMinutes = 0;

    const attendanceByDepartment = new Map<
      string,
      { department: string; rate: number; present: number; total: number }
    >();

    for (const r of attendanceRecords as any[]) {
      const status = r.status;
      const deptName = r.employee?.department?.nameAr || r.employee?.department?.name || "غير محدد";

      const dept = attendanceByDepartment.get(deptName) || {
        department: deptName,
        rate: 0,
        present: 0,
        total: 0
      };

      // Exclude non-working statuses from rate calculations
      if (!["HOLIDAY", "WEEKEND", "ON_LEAVE"].includes(status)) {
        dept.total += 1;
        if (["PRESENT", "LATE", "EARLY_LEAVE"].includes(status)) dept.present += 1;
      }

      if (status === "LATE") lateArrivals += 1;
      if (status === "ABSENT") absences += 1;
      if (["PRESENT", "LATE", "EARLY_LEAVE"].includes(status)) present += 1;

      overtimeMinutes += Number(r.overtimeMinutes || 0);

      attendanceByDepartment.set(deptName, dept);
    }

    const attendanceByDepartmentList = Array.from(attendanceByDepartment.values())
      .map((d) => ({
        department: d.department,
        rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
      }))
      .sort((a, b) => b.rate - a.rate);

    const averageAttendanceRate =
      present + absences > 0 ? Math.round((present / (present + absences)) * 100) : 0;

    const overtimeHours = Number((overtimeMinutes / 60).toFixed(1));

    // Payroll analytics
    const payslips = await prisma.payrollPayslip.findMany({
      where: {
        tenantId,
        payrollPeriod: {
          startDate: { gte: range.start, lte: range.end }
        }
      },
      select: {
        netSalary: true,
        totalEarnings: true,
        earnings: true,
        employeeId: true,
        employee: {
          select: {
            department: { select: { name: true, nameAr: true } }
          }
        }
      }
    });

    let totalPayroll = 0;
    const employeeIds = new Set<string>();
    const salaryByDepartment = new Map<string, { total: number; employeeIds: Set<string> }>();
    const allowances = new Map<string, { name: string; nameAr?: string; amount: number }>();

    for (const p of payslips as any[]) {
      const net = toNumber(p.netSalary);
      totalPayroll += net;
      employeeIds.add(p.employeeId);

      const deptName = p.employee?.department?.nameAr || p.employee?.department?.name || "غير محدد";
      const deptAgg = salaryByDepartment.get(deptName) || {
        total: 0,
        employeeIds: new Set<string>()
      };
      deptAgg.total += net;
      deptAgg.employeeIds.add(p.employeeId);
      salaryByDepartment.set(deptName, deptAgg);

      const earnings = Array.isArray(p.earnings) ? p.earnings : [];
      for (const e of earnings as any[]) {
        if (!e?.type) continue;
        const type = String(e.type);
        const current = allowances.get(type) || {
          name: e.name || type,
          nameAr: e.nameAr,
          amount: 0
        };
        current.amount += toNumber(e.amount);
        allowances.set(type, current);
      }
    }

    const averageSalary = employeeIds.size > 0 ? totalPayroll / employeeIds.size : 0;

    const salaryByDepartmentList = Array.from(salaryByDepartment.entries())
      .map(([department, agg]) => ({
        department,
        total: agg.total,
        average: agg.employeeIds.size > 0 ? agg.total / agg.employeeIds.size : 0
      }))
      .sort((a, b) => b.total - a.total);

    const allowancesBreakdown = Array.from(allowances.values())
      .map((a) => ({
        name: a.nameAr || a.name,
        amount: Math.round(a.amount)
      }))
      .sort((a, b) => b.amount - a.amount);

    // KPI cards (keep minimal + real; no fake trends)
    const kpis = [
      {
        id: "kpi-employees",
        name: "الموظفين",
        value: totalEmployees
      },
      {
        id: "kpi-attendance",
        name: "الحضور",
        value: averageAttendanceRate,
        unit: "%"
      },
      {
        id: "kpi-payroll",
        name: "إجمالي الرواتب",
        value: Math.round(totalPayroll),
        unit: currency
      },
      {
        id: "kpi-newhires",
        name: "تعيينات جديدة",
        value: newHires
      },
      {
        id: "kpi-terminations",
        name: "مغادرون",
        value: terminations
      },
      {
        id: "kpi-overtime",
        name: "ساعات إضافية",
        value: overtimeHours,
        unit: "س"
      }
    ].map((k) => ({
      ...k,
      trend: "neutral" as const
    }));

    return NextResponse.json({
      data: {
        currency,
        period,
        kpis,
        hr: {
          totalEmployees,
          newHires,
          terminations,
          turnoverRate,
          headcountByDepartment,
          headcountByNationality,
          ageDistribution,
          employmentTypeDistribution
        },
        attendance: {
          averageAttendanceRate,
          lateArrivals,
          absences,
          overtimeHours,
          attendanceByDepartment: attendanceByDepartmentList
        },
        payroll: {
          totalPayroll: Math.round(totalPayroll),
          averageSalary: Math.round(averageSalary),
          salaryByDepartment: salaryByDepartmentList.map((x) => ({
            department: x.department,
            total: Math.round(x.total),
            average: Math.round(x.average)
          })),
          allowancesBreakdown
        }
      }
    });
  } catch (error) {
    logger.error("Error fetching analytics overview", undefined, error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
