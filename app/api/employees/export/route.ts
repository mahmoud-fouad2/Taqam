import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function escapeCsv(value: unknown): string {
  const s = String(value ?? "");
  if (/[\n\r",]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toYmd(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const where: any = { tenantId };
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        employeeNumber: true,
        firstName: true,
        lastName: true,
        firstNameAr: true,
        lastNameAr: true,
        email: true,
        phone: true,
        nationalId: true,
        hireDate: true,
        departmentId: true,
        jobTitleId: true,
        managerId: true,
        baseSalary: true,
        currency: true,
        status: true,
        employmentType: true,
        dateOfBirth: true
      }
    });

    const headers = [
      "employeeNumber",
      "firstName",
      "lastName",
      "firstNameAr",
      "lastNameAr",
      "email",
      "phone",
      "nationalId",
      "hireDate",
      "departmentId",
      "jobTitleId",
      "managerId",
      "baseSalary",
      "currency",
      "status",
      "employmentType",
      "dateOfBirth"
    ];

    const lines: string[] = [];
    lines.push(headers.join(","));
    for (const e of employees) {
      lines.push(
        [
          e.employeeNumber,
          e.firstName,
          e.lastName,
          e.firstNameAr ?? "",
          e.lastNameAr ?? "",
          e.email,
          e.phone ?? "",
          e.nationalId ?? "",
          toYmd(e.hireDate),
          e.departmentId ?? "",
          e.jobTitleId ?? "",
          e.managerId ?? "",
          e.baseSalary ?? "",
          e.currency ?? "",
          e.status ?? "",
          e.employmentType ?? "",
          toYmd(e.dateOfBirth)
        ]
          .map(escapeCsv)
          .join(",")
      );
    }

    const csv = "\uFEFF" + lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=employees_export_${new Date().toISOString().split("T")[0]}.csv`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Error exporting employees CSV:", error);
    return NextResponse.json({ error: "Failed to export employees" }, { status: 500 });
  }
}
