/**
 * Payroll Salary Structure API
 * GET /api/payroll/structures/:id
 * PUT /api/payroll/structures/:id
 * DELETE /api/payroll/structures/:id
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateSalaryStructureSchema = z
  .object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    components: z.any()
  })
  .passthrough();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { id } = await params;

    const structure = await prisma.salaryStructure.findFirst({
      where: { id, tenantId }
    });

    if (!structure) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: structure });
  } catch (error) {
    console.error("Error fetching salary structure:", error);
    return NextResponse.json({ error: "Failed to fetch salary structure" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { id } = await params;
    const rawBody = await request.json();
    const parsedBody = updateSalaryStructureSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }
    const body = parsedBody.data;

    const isDefault = body?.isDefault === undefined ? undefined : Boolean(body.isDefault);

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.salaryStructure.updateMany({
          where: { tenantId, isDefault: true, NOT: { id } },
          data: { isDefault: false }
        });
      }

      return tx.salaryStructure.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.nameAr !== undefined ? { nameAr: body.nameAr } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(isDefault !== undefined ? { isDefault } : {}),
          ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
          ...(body.components !== undefined ? { components: body.components } : {})
        }
      });
    });

    if (updated.tenantId !== tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating salary structure:", error);
    return NextResponse.json({ error: "Failed to update salary structure" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { id } = await params;

    const existing = await prisma.salaryStructure.findFirst({
      where: { id, tenantId },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.salaryStructure.delete({ where: { id } });

    return NextResponse.json({ data: null });
  } catch (error) {
    console.error("Error deleting salary structure:", error);
    return NextResponse.json({ error: "Failed to delete salary structure" }, { status: 500 });
  }
}
