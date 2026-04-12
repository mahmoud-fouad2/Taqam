import { logApiError } from "@/lib/api/route-helper";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

type RoleDto = {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  permissions: Array<{ id: string; module: string; action: string; granted: boolean }>;
  isSystem: boolean;
  usersCount: number;
  createdAt: string;
};

const ROLE_LABELS: Record<string, { ar: string; en: string; descriptionAr: string }> = {
  TENANT_ADMIN: {
    ar: "مدير النظام",
    en: "Tenant Administrator",
    descriptionAr: "صلاحيات كاملة على النظام"
  },
  HR_MANAGER: {
    ar: "مدير الموارد البشرية",
    en: "HR Manager",
    descriptionAr: "إدارة شؤون الموظفين والموافقات"
  },
  MANAGER: { ar: "مدير", en: "Manager", descriptionAr: "إدارة الفريق والموافقات" },
  EMPLOYEE: { ar: "موظف", en: "Employee", descriptionAr: "الخدمة الذاتية الأساسية" }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const [tenant, grouped] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { createdAt: true } }),
      prisma.user.groupBy({
        by: ["role"],
        where: { tenantId },
        _count: { _all: true }
      })
    ]);

    const counts = new Map<string, number>();
    for (const g of grouped) {
      counts.set(String(g.role), (g as any)?._count?._all ?? 0);
    }

    const createdAt = (tenant?.createdAt ?? new Date()).toISOString();

    const roles: RoleDto[] = Object.entries(ROLE_LABELS).map(([roleKey, labels]) => ({
      id: `system-${roleKey}`,
      name: labels.ar,
      nameEn: labels.en,
      description: labels.descriptionAr,
      permissions: [],
      isSystem: true,
      usersCount: counts.get(roleKey) ?? 0,
      createdAt
    }));

    return NextResponse.json({ data: roles });
  } catch (e) {
    logApiError("GET /api/settings/roles failed", e);
    return NextResponse.json({ error: "Failed to load roles" }, { status: 500 });
  }
}
