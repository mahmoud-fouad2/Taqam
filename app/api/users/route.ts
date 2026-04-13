import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/access-control";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { EmploymentType } from "@prisma/client";

import {
  allocateNextEmployeeNumber,
  findOrCreateDefaultDepartmentId
} from "@/lib/employees/provisioning";
import {
  ensureTenantJobTitleCatalog,
  getDefaultJobTitleCodeForUserRole
} from "@/lib/hr/job-title-catalog";

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
        { lastName: { contains: q, mode: "insensitive" } }
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
          tenantId: true,
          lastLoginAt: true,
          createdAt: true
        }
      })
    ]);

    return NextResponse.json({
      data: users,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
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
    const employeeId = typeof body.employeeId === "string" ? body.employeeId.trim() : "";
    const normalizedEmail = email?.toLowerCase();

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!canAssignRole(session.user.role, role)) {
      return NextResponse.json({ error: "غير مسموح بتعيين هذا الدور" }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
    }

    let employeeToLink: { id: string } | null = null;

    if (employeeId) {
      const requestedEmployee = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId,
          deletedAt: null
        },
        select: {
          id: true,
          userId: true
        }
      });

      if (!requestedEmployee) {
        return NextResponse.json({ error: "الموظف المحدد غير موجود" }, { status: 400 });
      }

      if (requestedEmployee.userId) {
        return NextResponse.json(
          { error: "الموظف المحدد مرتبط بالفعل بحساب مستخدم" },
          { status: 400 }
        );
      }

      employeeToLink = { id: requestedEmployee.id };
    } else {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          userId: null,
          email: normalizedEmail
        },
        select: { id: true }
      });

      employeeToLink = existingEmployee ? { id: existingEmployee.id } : null;
    }

    const shouldCreateEmployee = !employeeToLink;

    if (shouldCreateEmployee) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxEmployees: true }
      });

      if (tenant?.maxEmployees != null) {
        const currentCount = await prisma.employee.count({
          where: { tenantId, status: { not: "TERMINATED" } }
        });

        if (currentCount >= tenant.maxEmployees) {
          return NextResponse.json(
            {
              error: `لقد وصلت إلى الحد الأقصى للموظفين في باقتك (${tenant.maxEmployees} موظف). يرجى الترقية إلى باقة أعلى.`,
              code: "PLAN_LIMIT_EXCEEDED",
              limit: tenant.maxEmployees,
              current: currentCount
            },
            { status: 403 }
          );
        }
      }

      await ensureTenantJobTitleCatalog(tenantId);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const employeeLinkMode = employeeToLink ? "linked" : shouldCreateEmployee ? "created" : "none";

    // Create user and ensure it has an employee record in the tenant workspace.
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          password: hashedPassword,
          role,
          phone: phone || null,
          tenantId,
          status: "ACTIVE"
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          tenantId: true
        }
      });

      if (employeeToLink) {
        const linked = await tx.employee.updateMany({
          where: {
            id: employeeToLink.id,
            tenantId,
            userId: null,
            deletedAt: null
          },
          data: {
            userId: createdUser.id
          }
        });

        if (linked.count !== 1) {
          throw new Error("الموظف المحدد مرتبط بالفعل بحساب آخر");
        }
      } else if (shouldCreateEmployee) {
        const departmentId = await findOrCreateDefaultDepartmentId(tx, tenantId);
        const preferredJobTitleCode = getDefaultJobTitleCodeForUserRole(role);
        const defaultJobTitle =
          (await tx.jobTitle.findFirst({
            where: {
              tenantId,
              code: preferredJobTitleCode,
              isActive: true
            },
            select: { id: true }
          })) ||
          (await tx.jobTitle.findFirst({
            where: {
              tenantId,
              code: "EMPLOYEE",
              isActive: true
            },
            select: { id: true }
          })) ||
          (await tx.jobTitle.findFirst({
            where: {
              tenantId,
              isActive: true
            },
            orderBy: [{ level: "asc" }, { name: "asc" }],
            select: { id: true }
          }));

        if (!defaultJobTitle) {
          throw new Error("لا توجد مسميات وظيفية جاهزة لربط المستخدم بملف موظف");
        }

        const employeeNumber = await allocateNextEmployeeNumber(tx, tenantId);

        await tx.employee.create({
          data: {
            tenantId,
            userId: createdUser.id,
            employeeNumber,
            firstName,
            lastName,
            email: normalizedEmail,
            phone: phone || null,
            departmentId,
            jobTitleId: defaultJobTitle.id,
            hireDate: new Date(),
            employmentType: EmploymentType.FULL_TIME,
            status: "ACTIVE"
          }
        });
      }

      return createdUser;
    });

    logger.info("User created", {
      userId: user.id,
      email: user.email,
      tenantId,
      employeeLinkMode
    });

    return NextResponse.json({ data: user, meta: { employeeLinkMode } }, { status: 201 });
  } catch (error) {
    logger.error("Error creating user", undefined, error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
