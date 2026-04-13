/**
 * Custom Roles API
 * GET  /api/roles          → list custom roles for tenant
 * POST /api/roles          → create custom role
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import prisma from "@/lib/db";
import { ALL_PERMISSIONS, sanitizeCustomRolePermissions, BUILTIN_ROLE_PERMISSIONS } from "@/lib/rbac";

const createRoleSchema = z.object({
  name: z.string().min(2).max(60),
  nameAr: z.string().max(60).optional(),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).default([])
});

export async function GET() {
  try {
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId, session } = result;

    // Only admins can manage roles
    if (!["TENANT_ADMIN", "HR_MANAGER"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const customRoles = await prisma.customRole.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
        permissions: true,
        isBuiltin: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true } }
      },
      orderBy: [{ isBuiltin: "desc" }, { name: "asc" }]
    });

    return NextResponse.json({ data: customRoles });
  } catch (error) {
    logApiError("GET roles error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;
    const { tenantId, session } = result;

    if (session.user.role !== "TENANT_ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const rateLimit = await checkRateLimit(req, {
      keyPrefix: `roles:${tenantId}`,
      limit: 20,
      windowMs: 60_000
    });
    if (!rateLimit.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "طلبات كثيرة، حاول لاحقاً" }, { status: 429 }),
        rateLimit
      );
    }

    const body = await req.json();
    const parsed = createRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة", details: parsed.error.issues }, { status: 400 });
    }

    // Enforce max 50 custom roles per tenant
    const count = await prisma.customRole.count({ where: { tenantId } });
    if (count >= 50) {
      return NextResponse.json({ error: "الحد الأقصى 50 دور مخصص" }, { status: 422 });
    }

    // Sanitize permissions to prevent privilege escalation
    const safePermissions = sanitizeCustomRolePermissions(parsed.data.permissions);

    const role = await prisma.customRole.create({
      data: {
        tenantId,
        name: parsed.data.name,
        nameAr: parsed.data.nameAr,
        description: parsed.data.description,
        permissions: safePermissions,
        isBuiltin: false
      }
    });

    return NextResponse.json({ data: role }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "يوجد دور بهذا الاسم مسبقاً" }, { status: 409 });
    }
    logApiError("POST role error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
