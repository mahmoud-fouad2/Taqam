/**
 * Activate Tenant API - Super Admin Only
 * /api/admin/tenants/[id]/activate
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logApiError } from "@/lib/api/route-helper";
import { mapTenantFromDb } from "@/lib/admin/tenant-mapping";
import { ensureTenantAdminWorkspaceProfile } from "@/lib/tenant-activation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const currentTenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        settings: true
      }
    });

    if (!currentTenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    if (currentTenant.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: "Cancelled tenants cannot be reactivated" },
        { status: 409 }
      );
    }

    const existingAdmin = await prisma.user.findFirst({
      where: { tenantId: id, role: "TENANT_ADMIN" },
      select: { id: true }
    });

    if (!existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "لا يمكن تفعيل الشركة قبل إنشاء مدير شركة وربطه بمساحة العمل"
        },
        { status: 409 }
      );
    }

    const currentSettings =
      currentTenant.settings && typeof currentTenant.settings === "object"
        ? ({ ...currentTenant.settings } as Record<string, unknown>)
        : {};

    delete currentSettings.suspendReason;
    delete currentSettings.suspendedAt;
    delete currentSettings.suspendedBy;

    const tenant = await prisma.$transaction(async (tx) => {
      const adminWorkspaceProfile = await ensureTenantAdminWorkspaceProfile(tx, {
        tenantId: id,
        userId: existingAdmin.id
      });

      const updatedTenant = await tx.tenant.update({
        where: { id },
        data: {
          status: "ACTIVE",
          settings: currentSettings
        },
        include: {
          _count: {
            select: {
              employees: true,
              users: true
            }
          }
        }
      });

      if (currentTenant.status !== "ACTIVE") {
        await tx.auditLog.create({
          data: {
            tenantId: id,
            userId: session.user.id ?? null,
            action: "TENANT_ACTIVATED",
            entity: "Tenant",
            entityId: id,
            newData: {
              source: "super-admin-manual-activation",
              previousStatus: currentTenant.status
            }
          }
        });
      }

      if (adminWorkspaceProfile && adminWorkspaceProfile.action !== "existing") {
        await tx.auditLog.create({
          data: {
            tenantId: id,
            userId: session.user.id ?? null,
            action: "TENANT_ADMIN_EMPLOYEE_LINKED",
            entity: "Employee",
            entityId: adminWorkspaceProfile.employeeId,
            newData: {
              source: "super-admin-manual-activation",
              action: adminWorkspaceProfile.action,
              adminUserId: adminWorkspaceProfile.adminUserId
            }
          }
        });
      }

      return updatedTenant;
    });

    return NextResponse.json({
      success: true,
      data: mapTenantFromDb(tenant)
    });
  } catch (error) {
    logApiError("Error activating tenant", error);
    return NextResponse.json(
      { success: false, error: "Failed to activate tenant" },
      { status: 500 }
    );
  }
}
