import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog, getRequestMetadata } from "@/lib/audit/logger";
import {
  bulkEmployeesSchema,
  insertPreparedEmployees,
  prepareEmployeesForInsert
} from "@/lib/employees/bulk";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = new Set(["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"]);
    if (!allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bulkEmployeesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { dryRun, atomic, employees } = parsed.data;

    const tenantId =
      session.user.role === "SUPER_ADMIN" ? parsed.data.tenantId : session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required (tenantId)" }, { status: 400 });
    }

    let prepared;
    try {
      prepared = await prepareEmployeesForInsert({ tenantId, employees });
    } catch (e: any) {
      if (e?.message?.includes("Duplicate employeeNumber")) {
        const duplicates = (e as any)?.duplicates as string[] | undefined;
        return NextResponse.json(
          {
            error: "Duplicate employeeNumber in request",
            duplicates: (duplicates || []).slice(0, 20)
          },
          { status: 400 }
        );
      }
      throw e;
    }

    if (dryRun) {
      return NextResponse.json({
        data: {
          dryRun: true,
          tenantId,
          total: prepared.length,
          sample: prepared.slice(0, 5)
        }
      });
    }

    let summary;
    try {
      summary = await insertPreparedEmployees({ prepared, atomic });
    } catch (e: any) {
      const message = e?.message ?? "Bulk insert failed";
      const { ipAddress, userAgent } = getRequestMetadata(request);
      await createAuditLog({
        tenantId,
        userId: session.user.id,
        action: "EMPLOYEE_BULK_IMPORT",
        entity: "Employee",
        newData: {
          atomic: true,
          total: prepared.length,
          success: 0,
          failed: prepared.length,
          message
        },
        ipAddress,
        userAgent
      });

      return NextResponse.json({ error: "Bulk insert failed (atomic)", message }, { status: 400 });
    }

    const { ipAddress, userAgent } = getRequestMetadata(request);
    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: "EMPLOYEE_BULK_IMPORT",
      entity: "Employee",
      newData: {
        total: summary.total,
        atomic: summary.atomic,
        success: summary.success,
        failed: summary.failed
      },
      ipAddress,
      userAgent
    });

    return NextResponse.json({ data: summary }, { status: 200 });
  } catch (error) {
    console.error("Error bulk importing employees:", error);
    return NextResponse.json({ error: "Failed to bulk import employees" }, { status: 500 });
  }
}
