/**
 * Employees API Routes
 * GET /api/employees - List employees
 * POST /api/employees - Create employee
 */

import { NextRequest, NextResponse } from "next/server";
import { EmploymentType, Gender } from "@prisma/client";
import prisma from "@/lib/db";
import {
  dataResponse,
  errorResponse,
  forbiddenResponse,
  logApiError,
  parsePagination,
  requireRole,
  requireTenantSession,
  validationErrorResponse
} from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { z } from "zod";

const EMPLOYEE_LIST_ROLES = new Set(["TENANT_ADMIN", "HR_MANAGER", "MANAGER"]);

const createEmployeeRequiredSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  hireDate: z.string().min(1)
});

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeEnumValue<T extends string>(value: unknown, allowed: readonly T[]) {
  const normalized = normalizeOptionalString(value)
    ?.toUpperCase()
    .replace(/[-\s]+/g, "_") as T | undefined;

  if (!normalized) {
    return undefined;
  }

  return allowed.includes(normalized) ? normalized : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId, session } = auth;

    if (!EMPLOYEE_LIST_ROLES.has(session.user.role)) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams, 100);
    const search = searchParams.get("search")?.trim() || "";
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {
      deletedAt: null
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } }
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: true,
          jobTitle: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.employee.count({ where })
    ]);

    return NextResponse.json({
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logApiError("Error fetching employees", error);
    return errorResponse("Failed to fetch employees");
  }
}

export async function POST(request: NextRequest) {
  try {
    const limit = 120;
    const rl = await checkRateLimit(request, {
      keyPrefix: "api:employees:create",
      limit,
      windowMs: 60 * 1000
    });
    if (!rl.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        { limit, remaining: rl.remaining, resetAt: rl.resetAt }
      );
    }

    const auth = await requireRole(request, ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"]);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    // ── Plan Limit Enforcement ──────────────────────────────────────
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxEmployees: true, plan: true }
    });
    if (tenant) {
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
    // ────────────────────────────────────────────────────────────────

    const rawBody = await request.json();
    const empValidation = createEmployeeRequiredSchema.safeParse(rawBody);
    if (!empValidation.success) {
      return validationErrorResponse(empValidation.error.flatten(), "بيانات غير صالحة");
    }
    const body = rawBody;

    const userId = normalizeOptionalString(body.userId);
    const departmentId = normalizeOptionalString(body.departmentId);
    const jobTitleId = normalizeOptionalString(body.jobTitleId);
    const managerId = normalizeOptionalString(body.managerId);
    const shiftId = normalizeOptionalString(body.shiftId);
    const branchId = normalizeOptionalString(body.branchId);

    const departmentCode = normalizeOptionalString(body.departmentCode);
    const jobTitleCode = normalizeOptionalString(body.jobTitleCode);
    const branchCode = normalizeOptionalString(body.branchCode);

    const gender = normalizeEnumValue(body.gender, Object.values(Gender));
    if (body.gender && !gender) {
      return errorResponse("Invalid gender value", 400);
    }

    const employmentType =
      normalizeEnumValue(body.employmentType, Object.values(EmploymentType)) ??
      EmploymentType.FULL_TIME;

    const baseSalaryValue = body.baseSalary;
    const normalizedBaseSalary =
      baseSalaryValue === undefined || baseSalaryValue === null || baseSalaryValue === ""
        ? undefined
        : Number(baseSalaryValue);

    if (normalizedBaseSalary !== undefined && Number.isNaN(normalizedBaseSalary)) {
      return errorResponse("Invalid baseSalary value", 400);
    }

    if (userId) {
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId },
        select: { id: true }
      });
      if (!user) {
        return errorResponse("Invalid userId", 400);
      }

      const alreadyLinked = await prisma.employee.findUnique({
        where: { userId },
        select: { id: true }
      });
      if (alreadyLinked) {
        return errorResponse("User is already linked to an employee", 400);
      }
    }

    const [department, jobTitle, branch] = await Promise.all([
      !departmentId && departmentCode
        ? prisma.department.findFirst({
            where: { tenantId, code: departmentCode, isActive: true },
            select: { id: true }
          })
        : Promise.resolve(null),
      !jobTitleId && jobTitleCode
        ? prisma.jobTitle.findFirst({
            where: { tenantId, code: jobTitleCode, isActive: true },
            select: { id: true }
          })
        : Promise.resolve(null),
      !branchId && branchCode
        ? prisma.branch.findFirst({
            where: { tenantId, code: branchCode, isActive: true },
            select: { id: true }
          })
        : Promise.resolve(null)
    ]);

    if (!departmentId && departmentCode && !department) {
      return errorResponse(`Unknown department code: ${departmentCode}`, 400);
    }

    if (!jobTitleId && jobTitleCode && !jobTitle) {
      return errorResponse(`Unknown job title code: ${jobTitleCode}`, 400);
    }

    if (!branchId && branchCode && !branch) {
      return errorResponse(`Unknown branch code: ${branchCode}`, 400);
    }

    // Generate employee number
    // Production data may contain non-numeric employee numbers (e.g. "EMP001-DEMO").
    // Use a fast DB max query when available, but fall back to a JS scan if the DB
    // doesn't support the regex/cast (or if it errors for any reason).
    let nextNumber: string;
    try {
      const maxNumeric = await prisma.$queryRaw<Array<{ max: number | null }>>`
        SELECT MAX(CAST("employeeNumber" AS INT)) as max
        FROM "Employee"
        WHERE "tenantId" = ${tenantId}
          AND "employeeNumber" ~ '^[0-9]+$'
      `;
      const currentMax = maxNumeric?.[0]?.max ?? 0;
      nextNumber = String(currentMax + 1).padStart(6, "0");
    } catch {
      const rows = await prisma.employee.findMany({
        where: { tenantId },
        select: { employeeNumber: true },
        take: 2000
      });

      let max = 0;
      for (const r of rows) {
        const n = r.employeeNumber;
        if (typeof n === "string" && /^\d+$/.test(n)) {
          const parsed = Number.parseInt(n, 10);
          if (Number.isFinite(parsed) && parsed > max) max = parsed;
        }
      }

      nextNumber = String(max + 1).padStart(6, "0");
    }

    // Avoid rare collisions under concurrency by retrying a few numbers forward.
    let employee = null as any;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = String(Number.parseInt(nextNumber, 10) + attempt).padStart(6, "0");
      try {
        employee = await prisma.employee.create({
          data: {
            tenantId,
            userId: userId ?? undefined,
            employeeNumber: candidate,
            firstName: body.firstName,
            lastName: body.lastName,
            firstNameAr: body.firstNameAr,
            lastNameAr: body.lastNameAr,
            email: body.email,
            phone: body.phone,
            nationalId: body.nationalId,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            gender,
            nationality: body.nationality,
            maritalStatus: body.maritalStatus,
            departmentId: departmentId ?? department?.id,
            jobTitleId: jobTitleId ?? jobTitle?.id,
            managerId,
            hireDate: new Date(body.hireDate),
            employmentType,
            status: "ACTIVE",
            shiftId,
            workLocation: body.workLocation,
            baseSalary: normalizedBaseSalary,
            branchId: branchId ?? branch?.id
          },
          include: {
            department: true,
            jobTitle: true
          }
        });
        break;
      } catch (e: any) {
        // Unique constraint collision on (tenantId, employeeNumber)
        if (e?.code === "P2002") continue;
        throw e;
      }
    }

    if (!employee) {
      return errorResponse("Failed to allocate employee number");
    }

    return dataResponse(employee, 201);
  } catch (error) {
    logApiError("Error creating employee", error);
    return errorResponse("Failed to create employee");
  }
}
