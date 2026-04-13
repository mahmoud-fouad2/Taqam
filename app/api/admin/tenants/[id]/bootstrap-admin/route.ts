import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * DEV-ONLY helper endpoint.
 * Creates/updates a TENANT_ADMIN user for a specific tenant.
 *
 * - Protected: SUPER_ADMIN session only
 * - Disabled in production
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, name: true, status: true }
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
    return NextResponse.json({ error: "Tenant is not available" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const firstName = String(body.firstName || "Tenant").trim() || "Tenant";
  const lastName = String(body.lastName || "Admin").trim() || "Admin";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 chars" }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, tenantId: true }
  });

  const user = await prisma.$transaction(async (tx) => {
    if (tenant.status === "PENDING") {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: "ACTIVE" }
      });
    }

    return existing
      ? await tx.user.update({
          where: { email },
          data: {
            password: passwordHash,
            role: "TENANT_ADMIN",
            status: "ACTIVE",
            tenantId,
            failedLoginAttempts: 0,
            lockedUntil: null,
            firstName,
            lastName
          },
          select: { id: true, email: true, role: true, status: true, tenantId: true }
        })
      : await tx.user.create({
          data: {
            email,
            password: passwordHash,
            firstName,
            lastName,
            role: "TENANT_ADMIN",
            status: "ACTIVE",
            permissions: [],
            tenantId
          },
          select: { id: true, email: true, role: true, status: true, tenantId: true }
        });
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      user: { connect: { id: session.user.id } },
      action: existing ? "DEV_BOOTSTRAP_UPDATE_TENANT_ADMIN" : "DEV_BOOTSTRAP_CREATE_TENANT_ADMIN",
      entity: "User",
      entityId: user.id,
      newData: {
        targetEmail: user.email,
        tenantSlug: tenant.slug
      }
    }
  });

  return NextResponse.json({
    data: {
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      user
    }
  });
}
