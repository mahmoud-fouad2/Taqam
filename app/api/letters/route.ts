/**
 * Letters API
 * POST /api/letters  → generate a letter PDF and return it as a file download
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { buildLetterPdfBytes, type LetterType } from "@/lib/letters/letter-pdf.server";

export const runtime = "nodejs";

const generateLetterSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(["introductory", "salary", "experience"]),
});

export async function POST(req: NextRequest) {
  try {
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;
    const { tenantId, session } = result;

    // Only admin / HR can generate letters
    const role = session.user.role ?? "";
    if (!["TENANT_ADMIN", "HR_MANAGER", "MANAGER"].includes(role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = generateLetterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" }, { status: 400 });
    }

    const { employeeId, type } = parsed.data;

    // Fetch employee + tenant info (tenant-scoped)
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: {
        firstName: true,
        lastName: true,
        firstNameAr: true,
        lastNameAr: true,
        nationalId: true,
        hireDate: true,
        baseSalary: true,
        currency: true,
        status: true,
        jobTitle: { select: { name: true, nameAr: true } },
        department: { select: { name: true, nameAr: true } },
        tenant: { select: { name: true, nameAr: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    }

    const employeeName =
      (employee.firstNameAr && employee.lastNameAr)
        ? `${employee.firstNameAr} ${employee.lastNameAr}`
        : `${employee.firstName} ${employee.lastName}`;

    const companyName = employee.tenant.nameAr ?? employee.tenant.name;
    const jobTitle = employee.jobTitle?.nameAr ?? employee.jobTitle?.name ?? "موظف";
    const department = employee.department?.nameAr ?? employee.department?.name;

    // For experience letters, terminated employees may have an end date inferred
    // from the most recent expected end (prisma doesn't have termination date field by default; use null)
    const endDate: string | null =
      type === "experience" && employee.status !== "ACTIVE"
        ? new Date().toISOString()
        : null;

    const pdfBytes = await buildLetterPdfBytes({
      type: type as LetterType,
      employeeName,
      jobTitle,
      department,
      hireDate: employee.hireDate.toISOString(),
      endDate,
      nationalId: employee.nationalId ?? undefined,
      salary: employee.baseSalary ? Number(employee.baseSalary) : undefined,
      currency: employee.currency,
      companyName,
    });

    const letterTitles: Record<LetterType, string> = {
      introductory: "خطاب-تعريف",
      salary: "خطاب-راتب",
      experience: "شهادة-خبرة",
    };
    const filename = `${letterTitles[type as LetterType]}_${employeeName.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": String(pdfBytes.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logApiError("POST /api/letters error", error);
    return NextResponse.json({ error: "حدث خطأ أثناء توليد الخطاب" }, { status: 500 });
  }
}
