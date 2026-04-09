import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const currentYear = new Date().getFullYear();

    const [types, balances] = await Promise.all([
      prisma.leaveType.findMany({
        where: { tenantId: payloadOrRes.tenantId, isActive: true },
        select: {
          id: true,
          name: true,
          nameAr: true,
          code: true,
          isPaid: true,
          requiresApproval: true,
          requiresAttachment: true,
          defaultDays: true,
          maxDays: true,
          color: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.leaveBalance.findMany({
        where: {
          tenantId: payloadOrRes.tenantId,
          employeeId: payloadOrRes.employeeId,
          year: currentYear,
        },
        select: {
          leaveTypeId: true,
          entitled: true,
          used: true,
          pending: true,
          carriedOver: true,
          adjustment: true,
        },
      }),
    ]);

    const balanceMap = new Map(balances.map((b) => [b.leaveTypeId, b]));

    return NextResponse.json({
      data: types.map((lt) => {
        const bal = balanceMap.get(lt.id);
        const entitled = Number(bal?.entitled ?? lt.defaultDays ?? 0);
        const used = Number(bal?.used ?? 0);
        const pending = Number(bal?.pending ?? 0);
        const carried = Number(bal?.carriedOver ?? 0);
        const adj = Number(bal?.adjustment ?? 0);

        return {
          ...lt,
          balance: {
            entitled,
            used,
            pending,
            remaining: Math.max(0, entitled - used - pending + carried + adj),
          },
        };
      }),
    });
  } catch (error) {
    console.error("Mobile leave types GET error:", error);
    return NextResponse.json({ error: "Failed to fetch leave types" }, { status: 500 });
  }
}
