/**
 * Single Job Title API Routes
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobTitle = await prisma.jobTitle.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true
          }
        }
      }
    });

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title not found" }, { status: 404 });
    }

    if (session.user.tenantId && jobTitle.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ data: jobTitle });
  } catch (error) {
    logApiError("Error fetching job title", error);
    return NextResponse.json({ error: "Failed to fetch job title" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Job titles are managed centrally by the platform" },
      { status: 403 }
    );
  } catch (error) {
    logApiError("Error updating job title", error);
    return NextResponse.json({ error: "Failed to update job title" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Job titles are managed centrally by the platform" },
      { status: 403 }
    );
  } catch (error) {
    logApiError("Error deleting job title", error);
    return NextResponse.json({ error: "Failed to delete job title" }, { status: 500 });
  }
}
