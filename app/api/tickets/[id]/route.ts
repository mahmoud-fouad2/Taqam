import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { requireTenantOrSuperAdminSession } from "@/lib/api/route-helper";

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireTenantOrSuperAdminSession(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { tenantId, isSuperAdmin: superAdmin } = auth;

    const where: any = { id };
    if (!superAdmin) {
      where.tenantId = tenantId;
    }

    const ticket = await prisma.supportTicket.findFirst({
      where,
      include: {
        tenant: { select: { id: true, slug: true, name: true, nameAr: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireTenantOrSuperAdminSession(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { tenantId, isSuperAdmin: superAdmin } = auth;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!superAdmin) {
      if (!tenantId || existing.tenantId !== tenantId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const data: any = {};

    if (parsed.data.status) {
      data.status = parsed.data.status;
    }

    if (superAdmin) {
      if (parsed.data.priority) data.priority = parsed.data.priority;
      if (parsed.data.assignedToId !== undefined) data.assignedToId = parsed.data.assignedToId;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        tenant: { select: { id: true, slug: true, name: true, nameAr: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
