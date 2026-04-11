import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  dataResponse,
  errorResponse,
  logApiError,
  requireRole,
  requireTenantSession,
  validationErrorResponse
} from "@/lib/api/route-helper";
import {
  COMPENSATION_ADMIN_ROLES,
  getEmployeeCurrentSalary,
  saveEmployeeSalary
} from "@/lib/payroll/compensation";

const salaryComponentSchema = z.object({
  componentId: z.string().optional().default(""),
  type: z.enum([
    "basic",
    "housing",
    "transport",
    "food",
    "phone",
    "other",
    "overtime",
    "bonus",
    "commission",
    "incentive",
    "travel"
  ]),
  name: z.string().min(1),
  nameAr: z.string().min(1),
  amount: z.number().nonnegative(),
  isFixed: z.boolean().default(true)
});

const upsertEmployeeSalarySchema = z.object({
  structureId: z.string().min(1).optional().nullable(),
  basicSalary: z.number().nonnegative(),
  components: z.array(salaryComponentSchema).optional().default([]),
  effectiveDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  paymentMethod: z.enum(["bank_transfer", "cash", "check"]).optional(),
  currency: z.string().min(3).max(5).optional(),
  notes: z.string().optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;

    const { tenantId, session } = auth;
    const { id } = await params;
    const result = await getEmployeeCurrentSalary({
      tenantId,
      employeeId: id,
      userId: session.user.id,
      role: session.user.role
    });

    if ("error" in result) {
      const { error } = result;
      return errorResponse(error.message, error.status);
    }

    return dataResponse(result.salary);
  } catch (error) {
    logApiError("Error fetching employee salary", error);
    return errorResponse("Failed to fetch employee salary");
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(request, [...COMPENSATION_ADMIN_ROLES]);
    if (!auth.ok) return auth.response;

    const { tenantId } = auth;
    const { id } = await params;
    const body = await request.json();
    const validated = upsertEmployeeSalarySchema.parse(body);

    const result = await saveEmployeeSalary({
      tenantId,
      employeeId: id,
      ...validated
    });

    if ("error" in result) {
      const { error } = result;
      return errorResponse(error.message, error.status);
    }

    return dataResponse(result.salary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        error.flatten(),
        error.errors[0]?.message || "Invalid salary payload"
      );
    }

    logApiError("Error saving employee salary", error);
    return errorResponse("Failed to save employee salary");
  }
}
