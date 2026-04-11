import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog, getRequestMetadata } from "@/lib/audit/logger";
import { csvRowsToObjects, parseCsv } from "@/lib/csv/parse";
import {
  employeeBulkInputSchema,
  insertPreparedEmployees,
  prepareEmployeesForInsert
} from "@/lib/employees/bulk";

function parseDateFlexible(value: string | undefined): Date | undefined {
  const v = String(value || "").trim();
  if (!v) return undefined;

  // Accept yyyy-mm-dd or ISO
  const direct = new Date(v);
  if (!Number.isNaN(direct.getTime())) return direct;

  // Accept dd/mm/yyyy
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  return undefined;
}

function normalizeCurrency(value: string | undefined): string | undefined {
  const v = String(value || "").trim();
  if (!v) return undefined;
  return v.toUpperCase();
}

function toOptionalNumber(value: string | undefined): number | undefined {
  const v = String(value || "").trim();
  if (!v) return undefined;
  const normalized = v.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = new Set(["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"]);
    if (!allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const url = new URL(request.url);
    const tenantId =
      session.user.role === "SUPER_ADMIN"
        ? String(form.get("tenantId") || url.searchParams.get("tenantId") || "").trim()
        : session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required (tenantId)" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsv(text);
    const objects = csvRowsToObjects(rows);

    if (objects.length === 0) {
      return NextResponse.json(
        { data: { imported: 0, errors: ["CSV is empty"] } },
        { status: 200 }
      );
    }

    const errors: string[] = [];
    const validEmployees: any[] = [];

    // expected headers (normalized by csv util):
    // employeeNumber, firstName, lastName, firstNameAr, lastNameAr, email, phone, nationalId,
    // hireDate, departmentId, jobTitleId, managerId, baseSalary, currency, status, employmentType, dateOfBirth

    objects.forEach((obj, idx) => {
      const rowNumber = idx + 2; // + header row

      const hireDate = parseDateFlexible(obj.hiredate || obj.hire_date);
      const dateOfBirth = parseDateFlexible(obj.dateofbirth || obj.date_of_birth);

      const candidate = {
        employeeNumber: (obj.employeenumber || obj.employee_number || "").trim() || undefined,
        firstName: (obj.firstname || obj.first_name || "").trim(),
        lastName: (obj.lastname || obj.last_name || "").trim(),
        firstNameAr:
          (obj.firstnamear || obj.first_name_ar || obj.firstname_ar || "").trim() || undefined,
        lastNameAr:
          (obj.lastnamear || obj.last_name_ar || obj.lastname_ar || "").trim() || undefined,
        email: (obj.email || "").trim(),
        phone: (obj.phone || "").trim() || undefined,
        nationalId: (obj.nationalid || obj.national_id || "").trim() || undefined,

        hireDate: hireDate ?? new Date(""),
        departmentId: (obj.departmentid || obj.department_id || "").trim() || undefined,
        jobTitleId:
          (obj.jobtitleid || obj.job_title_id || obj.jobtitle_id || "").trim() || undefined,
        managerId: (obj.managerid || obj.manager_id || "").trim() || undefined,

        baseSalary: toOptionalNumber(obj.basesalary || obj.base_salary) ?? undefined,
        currency: normalizeCurrency(obj.currency) ?? undefined,
        status: (obj.status || "").trim() || undefined,
        employmentType: (obj.employmenttype || obj.employment_type || "").trim() || undefined,

        dateOfBirth,
        gender: (obj.gender || "").trim() || undefined,
        maritalStatus: (obj.maritalstatus || obj.marital_status || "").trim() || undefined,
        nationality: (obj.nationality || "").trim() || undefined
      };

      if (!hireDate) {
        errors.push(`Row ${rowNumber}: hireDate is required (yyyy-mm-dd)`);
        return;
      }

      const parsed = employeeBulkInputSchema.safeParse(candidate);
      if (!parsed.success) {
        errors.push(`Row ${rowNumber}: invalid data`);
        return;
      }

      validEmployees.push(parsed.data);
    });

    if (validEmployees.length === 0) {
      const { ipAddress, userAgent } = getRequestMetadata(request);
      await createAuditLog({
        tenantId,
        userId: session.user.id,
        action: "EMPLOYEE_BULK_IMPORT",
        entity: "Employee",
        newData: { imported: 0, failed: errors.length, source: "CSV" },
        ipAddress,
        userAgent
      });

      return NextResponse.json({ data: { imported: 0, errors } }, { status: 200 });
    }

    let prepared;
    try {
      prepared = await prepareEmployeesForInsert({ tenantId, employees: validEmployees });
    } catch (e: any) {
      if (e?.message?.includes("Duplicate employeeNumber")) {
        const duplicates = (e as any)?.duplicates as string[] | undefined;
        errors.push(
          `Duplicate employeeNumber in request: ${(duplicates || []).slice(0, 20).join(", ")}`
        );
        return NextResponse.json({ data: { imported: 0, errors } }, { status: 200 });
      }
      throw e;
    }

    const summary = await insertPreparedEmployees({ prepared, atomic: false });

    // Convert per-row errors into simple string list
    for (const err of summary.errors.slice(0, 200)) {
      errors.push(`Row ${err.index + 2}: ${err.employeeNumber} - ${err.message}`);
    }

    const { ipAddress, userAgent } = getRequestMetadata(request);
    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: "EMPLOYEE_BULK_IMPORT",
      entity: "Employee",
      newData: { imported: summary.success, failed: summary.failed, source: "CSV" },
      ipAddress,
      userAgent
    });

    return NextResponse.json(
      {
        data: {
          imported: summary.success,
          errors
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error importing employees CSV:", error);
    return NextResponse.json({ error: "Failed to import employees" }, { status: 500 });
  }
}
