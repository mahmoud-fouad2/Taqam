/**
 * Payroll Salary Structures API
 * GET /api/payroll/structures - List salary structures
 * POST /api/payroll/structures - Create salary structure
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const structures = await prisma.salaryStructure.findMany({
      where: { tenantId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({ data: structures });
  } catch (error) {
    console.error("Error fetching salary structures:", error);
    return NextResponse.json({ error: "Failed to fetch salary structures" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const body = await request.json();

    if (!body?.name || !body?.nameAr) {
      return NextResponse.json({ error: "name and nameAr are required" }, { status: 400 });
    }

    const isDefault = Boolean(body?.isDefault);

    const structure = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.salaryStructure.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false }
        });
      }

      return tx.salaryStructure.create({
        data: {
          tenantId,
          name: body.name,
          nameAr: body.nameAr,
          description: body.description,
          isDefault,
          isActive: body.isActive ?? true,
          components: body.components ?? []
        }
      });
    });

    return NextResponse.json({ data: structure }, { status: 201 });
  } catch (error) {
    console.error("Error creating salary structure:", error);
    return NextResponse.json({ error: "Failed to create salary structure" }, { status: 500 });
  }
}
