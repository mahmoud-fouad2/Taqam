import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/access-control";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";

const ALLOWED_ROLES = ["TENANT_ADMIN", "HR_MANAGER"] as const;
const MANAGEABLE_ROLES = new Set(["EMPLOYEE", "HR_MANAGER", "MANAGER", "TENANT_ADMIN"]);

function canAssignRole(actorRole: string | undefined, targetRole: string): boolean {
  if (!MANAGEABLE_ROLES.has(targetRole)) {
    return false;
  }

  if (targetRole === "TENANT_ADMIN") {
    return actorRole === "TENANT_ADMIN";
  }

  return hasRole(actorRole, ALLOWED_ROLES);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    if (!hasRole(session.user.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "20"), 1), 100);

    const where: any = { tenantId };
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: users,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error("Error fetching users", undefined, error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
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
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    if (!hasRole(session.user.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, password, role, phone } = body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!canAssignRole(session.user.role, role)) {
      return NextResponse.json({ error: "غير مسموح بتعيين هذا الدور" }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        phone: phone || null,
        tenantId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    logger.info("User created", { userId: user.id, email: user.email, tenantId });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    logger.error("Error creating user", undefined, error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
