import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payloadOrRes.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        permissions: true,
        tenantId: true,
        tenant: { select: { id: true, slug: true, name: true, nameAr: true, status: true, plan: true } },
        employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Mobile me error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const body = await request.json();
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : undefined;

    if (!firstName && !lastName) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const data: Record<string, string> = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;

    const updated = await prisma.user.update({
      where: { id: payloadOrRes.userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        permissions: true,
        tenantId: true,
        tenant: { select: { id: true, slug: true, name: true, nameAr: true, status: true, plan: true } },
        employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Mobile me update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
