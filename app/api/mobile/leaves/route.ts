import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

/* ── GET /api/mobile/leaves — list employee's leave requests ── */
export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const statusFilter = url.searchParams.get("status")?.toUpperCase();
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

    const where: any = {
      tenantId: payloadOrRes.tenantId,
      employeeId: payloadOrRes.employeeId
    };
    if (statusFilter && validStatuses.includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [items, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          leaveType: { select: { name: true, nameAr: true, color: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.leaveRequest.count({ where })
    ]);

    return NextResponse.json({
      data: {
        items: items.map((r) => ({
          id: r.id,
          leaveTypeName: r.leaveType.nameAr || r.leaveType.name,
          leaveTypeColor: r.leaveType.color,
          startDate: r.startDate.toISOString().slice(0, 10),
          endDate: r.endDate.toISOString().slice(0, 10),
          totalDays: Number(r.totalDays),
          reason: r.reason,
          status: r.status.toLowerCase(),
          createdAt: r.createdAt.toISOString()
        })),
        page,
        limit,
        total
      }
    });
  } catch (error) {
    logger.error("Mobile leaves GET error", undefined, error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}

const createSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  reason: z.string().trim().max(1000).optional()
});

function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 5 && day !== 6) count++; // exclude Fri & Sat (Saudi work week)
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export async function POST(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const raw = await request.json();
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { leaveTypeId, startDate, endDate, reason } = parsed.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({ error: "endDate must be >= startDate" }, { status: 400 });
    }

    // Verify leave type belongs to tenant
    const leaveType = await prisma.leaveType.findFirst({
      where: { id: leaveTypeId, tenantId: payloadOrRes.tenantId, isActive: true }
    });

    if (!leaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    const totalDays = countBusinessDays(start, end);

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        tenantId: payloadOrRes.tenantId,
        employeeId: payloadOrRes.employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason: reason ?? null,
        status: "PENDING"
      },
      include: {
        leaveType: { select: { name: true, nameAr: true } }
      }
    });

    // Increment pending balance
    const currentYear = start.getFullYear();
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: payloadOrRes.employeeId,
          leaveTypeId,
          year: currentYear
        }
      },
      create: {
        tenantId: payloadOrRes.tenantId,
        employeeId: payloadOrRes.employeeId,
        leaveTypeId,
        year: currentYear,
        pending: totalDays
      },
      update: {
        pending: { increment: totalDays }
      }
    });

    return NextResponse.json(
      {
        data: {
          id: leaveRequest.id,
          leaveTypeName: leaveRequest.leaveType.nameAr || leaveRequest.leaveType.name,
          startDate: leaveRequest.startDate.toISOString().slice(0, 10),
          endDate: leaveRequest.endDate.toISOString().slice(0, 10),
          totalDays: Number(leaveRequest.totalDays),
          status: "pending"
        }
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Mobile leaves POST error", undefined, error);
    return NextResponse.json({ error: "Failed to submit leave request" }, { status: 500 });
  }
}
