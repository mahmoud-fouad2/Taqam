/**
 * Seed Built-in Roles for a Tenant
 * POST /api/roles/seed  → idempotent: creates HR_MANAGER/MANAGER/EMPLOYEE default roles
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { BUILTIN_ROLE_PERMISSIONS } from "@/lib/rbac";

const SEEDED_ROLES = [
  { name: "HR Manager", nameAr: "مدير الموارد البشرية", role: "HR_MANAGER" },
  { name: "Manager", nameAr: "مدير", role: "MANAGER" },
  { name: "Employee", nameAr: "موظف", role: "EMPLOYEE" }
];

export async function POST(req: NextRequest) {
  try {
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;
    const { tenantId, session } = result;

    if (session.user.role !== "TENANT_ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const upserted = await Promise.all(
      SEEDED_ROLES.map((r) =>
        prisma.customRole.upsert({
          where: { tenantId_name: { tenantId, name: r.name } },
          create: {
            tenantId,
            name: r.name,
            nameAr: r.nameAr,
            permissions: BUILTIN_ROLE_PERMISSIONS[r.role] ?? [],
            isBuiltin: true
          },
          update: {} // Don't overwrite edited permissions
        })
      )
    );

    return NextResponse.json({ data: upserted });
  } catch (error) {
    logApiError("POST roles/seed error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
