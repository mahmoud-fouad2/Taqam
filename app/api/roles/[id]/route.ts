/**
 * Single Custom Role
 * GET    /api/roles/[id]   → role details
 * PATCH  /api/roles/[id]   → update name/permissions
 * DELETE /api/roles/[id]   → delete (cannot delete builtin)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { sanitizeCustomRolePermissions } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  nameAr: z.string().max(60).optional(),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()).optional()
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId, session } = result;

    if (!["TENANT_ADMIN", "HR_MANAGER"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const role = await prisma.customRole.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { users: true } } }
    });

    if (!role) return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });

    return NextResponse.json({ data: role });
  } catch (error) {
    logApiError("GET role error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId, session } = result;

    if (session.user.role !== "TENANT_ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const role = await prisma.customRole.findFirst({ where: { id, tenantId } });
    if (!role) return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة", details: parsed.error.issues }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.nameAr !== undefined) updateData.nameAr = parsed.data.nameAr;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.permissions !== undefined) {
      // Built-in roles CAN have their permissions updated (admin is responsible)
      // but sanitize privilege escalation vectors
      updateData.permissions = sanitizeCustomRolePermissions(parsed.data.permissions);
    }

    const updated = await prisma.customRole.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "يوجد دور بهذا الاسم مسبقاً" }, { status: 409 });
    }
    logApiError("PATCH role error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId, session } = result;

    if (session.user.role !== "TENANT_ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const role = await prisma.customRole.findFirst({ where: { id, tenantId } });
    if (!role) return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });
    if (role.isBuiltin) {
      return NextResponse.json({ error: "لا يمكن حذف الأدوار الافتراضية" }, { status: 422 });
    }

    // Unassign from users before deleting
    await prisma.$transaction([
      prisma.user.updateMany({ where: { customRoleId: id }, data: { customRoleId: null } }),
      prisma.customRole.delete({ where: { id } })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError("DELETE role error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
