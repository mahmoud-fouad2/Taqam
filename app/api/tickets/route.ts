import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { requireTenantOrSuperAdminSession } from "@/lib/api/route-helper";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).catch(1),
  limit: z.coerce.number().int().positive().max(100).default(20).catch(20),
  status: z.string().optional(),
  priority: z.string().optional(),
  tenantId: z.string().optional(),
});

const createSchema = z.object({
  subject: z.string().min(3).max(160),
  category: z.string().max(60).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  message: z.string().min(3).max(5000),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantOrSuperAdminSession(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { tenantId, isSuperAdmin: superAdmin } = auth;

    const { searchParams } = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      tenantId: searchParams.get("tenantId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const { page, limit, status, priority, tenantId: tenantFilter } = parsed.data;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (superAdmin) {
      if (tenantFilter) where.tenantId = tenantFilter;
    } else {
      where.tenantId = tenantId;
    }

    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limit,
        include: {
          tenant: {
            select: { id: true, slug: true, name: true, nameAr: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { messages: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      data: {
        items,
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantOrSuperAdminSession(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { session, tenantId } = auth;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }

    const now = new Date();
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant tickets must be created within a tenant" }, { status: 400 });
    }

    const created = await prisma.supportTicket.create({
      data: {
        tenantId,
        createdById: session.user.id,
        subject: parsed.data.subject,
        category: parsed.data.category,
        priority: parsed.data.priority,
        status: "OPEN",
        lastMessageAt: now,
        messages: {
          create: {
            senderId: session.user.id,
            body: parsed.data.message,
            isInternal: false,
          },
        },
      },
      include: {
        tenant: { select: { id: true, slug: true, name: true, nameAr: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
