/**
 * Job Titles API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const jobTitles = await prisma.jobTitle.findMany({
      where,
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ data: jobTitles });
  } catch (error) {
    console.error("Error fetching job titles:", error);
    return NextResponse.json({ error: "Failed to fetch job titles" }, { status: 500 });
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

    const jobTitle = await prisma.jobTitle.create({
      data: {
        tenantId,
        name: body.name,
        nameAr: body.nameAr,
        code: body.code,
        description: body.description,
        minSalary: body.minSalary,
        maxSalary: body.maxSalary,
        level: body.level || 1,
        isActive: true
      }
    });

    return NextResponse.json({ data: jobTitle }, { status: 201 });
  } catch (error) {
    console.error("Error creating job title:", error);
    return NextResponse.json({ error: "Failed to create job title" }, { status: 500 });
  }
}
