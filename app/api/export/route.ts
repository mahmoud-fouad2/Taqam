import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET - Export employees data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);

    const format = searchParams.get("format") || "json"; // json, csv, excel-json
    const type = searchParams.get("type") || "employees"; // employees, attendance, payroll, loans
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let data: any[] = [];
    let filename = "";
    let columns: { key: string; label: string }[] = [];

    switch (type) {
      case "employees":
        const whereEmployees: any = { tenantId };
        if (departmentId) whereEmployees.departmentId = departmentId;
        if (status) whereEmployees.status = status;

        const employees = await prisma.employee.findMany({
          where: whereEmployees,
          include: {
            department: { select: { name: true, nameAr: true } },
            jobTitle: { select: { name: true, nameAr: true } },
            manager: {
              select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true }
            }
          },
          orderBy: { createdAt: "desc" }
        });

        data = employees.map((emp) => ({
          employeeNumber: emp.employeeNumber || "",
          fullName: `${emp.firstNameAr || emp.firstName} ${emp.lastNameAr || emp.lastName}`,
          fullNameEn: `${emp.firstName} ${emp.lastName}`,
          email: emp.email || "",
          phone: emp.phone || "",
          department: emp.department?.nameAr || emp.department?.name || "",
          jobTitle: emp.jobTitle?.nameAr || emp.jobTitle?.name || "",
          manager: emp.manager
            ? `${emp.manager.firstNameAr || emp.manager.firstName} ${emp.manager.lastNameAr || emp.manager.lastName}`
            : "",
          hireDate: emp.hireDate ? new Date(emp.hireDate).toLocaleDateString("ar-SA") : "",
          employmentStatus: emp.status || "",
          nationalId: emp.nationalId || "",
          nationality: emp.nationality || ""
        }));

        columns = [
          { key: "employeeNumber", label: "رقم الموظف" },
          { key: "fullName", label: "الاسم الكامل" },
          { key: "fullNameEn", label: "الاسم بالإنجليزية" },
          { key: "email", label: "البريد الإلكتروني" },
          { key: "phone", label: "الهاتف" },
          { key: "department", label: "القسم" },
          { key: "jobTitle", label: "المسمى الوظيفي" },
          { key: "manager", label: "المدير المباشر" },
          { key: "hireDate", label: "تاريخ التعيين" },
          { key: "employmentStatus", label: "الحالة" },
          { key: "nationalId", label: "رقم الهوية" },
          { key: "nationality", label: "الجنسية" }
        ];
        filename = `employees_export_${new Date().toISOString().split("T")[0]}`;
        break;

      case "attendance":
        const whereAttendance: any = { tenantId };
        if (startDate) whereAttendance.date = { gte: new Date(startDate) };
        if (endDate) {
          whereAttendance.date = { ...whereAttendance.date, lte: new Date(endDate) };
        }

        const attendance = await prisma.attendanceRecord.findMany({
          where: whereAttendance,
          include: {
            employee: {
              select: {
                employeeNumber: true,
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
                department: { select: { name: true, nameAr: true } }
              }
            }
          },
          orderBy: { date: "desc" },
          take: 10000
        });

        data = attendance.map((rec) => ({
          date: new Date(rec.date).toLocaleDateString("ar-SA"),
          employeeNumber: rec.employee.employeeNumber || "",
          employeeName: `${rec.employee.firstNameAr || rec.employee.firstName} ${rec.employee.lastNameAr || rec.employee.lastName}`,
          department: rec.employee.department?.nameAr || rec.employee.department?.name || "",
          checkIn: rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString("ar-SA") : "",
          checkOut: rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString("ar-SA") : "",
          status: rec.status || "",
          workHours:
            rec.totalWorkMinutes !== null && rec.totalWorkMinutes !== undefined
              ? (rec.totalWorkMinutes / 60).toFixed(2)
              : "",
          overtimeHours:
            rec.overtimeMinutes !== null && rec.overtimeMinutes !== undefined
              ? (rec.overtimeMinutes / 60).toFixed(2)
              : "0",
          notes: rec.notes || ""
        }));

        columns = [
          { key: "date", label: "التاريخ" },
          { key: "employeeNumber", label: "رقم الموظف" },
          { key: "employeeName", label: "اسم الموظف" },
          { key: "department", label: "القسم" },
          { key: "checkIn", label: "وقت الحضور" },
          { key: "checkOut", label: "وقت الانصراف" },
          { key: "status", label: "الحالة" },
          { key: "workHours", label: "ساعات العمل" },
          { key: "overtimeHours", label: "ساعات إضافية" },
          { key: "notes", label: "ملاحظات" }
        ];
        filename = `attendance_export_${new Date().toISOString().split("T")[0]}`;
        break;

      case "payroll":
        const wherePayroll: any = { tenantId };

        if (startDate || endDate) {
          wherePayroll.payrollPeriod = {
            ...(startDate ? { startDate: { gte: new Date(startDate) } } : {}),
            ...(endDate ? { endDate: { lte: new Date(endDate) } } : {})
          };
        }

        const payroll = await prisma.payrollPayslip.findMany({
          where: wherePayroll,
          include: {
            employee: {
              select: {
                employeeNumber: true,
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
                department: { select: { name: true, nameAr: true } }
              }
            },
            payrollPeriod: {
              select: {
                startDate: true,
                endDate: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5000
        });

        data = payroll.map((rec) => ({
          period: `${new Date(rec.payrollPeriod.startDate).toLocaleDateString("ar-SA")} - ${new Date(rec.payrollPeriod.endDate).toLocaleDateString("ar-SA")}`,
          employeeNumber: rec.employee.employeeNumber || "",
          employeeName: `${rec.employee.firstNameAr || rec.employee.firstName} ${rec.employee.lastNameAr || rec.employee.lastName}`,
          department: rec.employee.department?.nameAr || rec.employee.department?.name || "",
          basicSalary: rec.basicSalary?.toString() || "0",
          totalEarnings: rec.totalEarnings?.toString() || "0",
          totalDeductions: rec.totalDeductions?.toString() || "0",
          netSalary: rec.netSalary?.toString() || "0",
          status: rec.status || ""
        }));

        columns = [
          { key: "period", label: "الفترة" },
          { key: "employeeNumber", label: "رقم الموظف" },
          { key: "employeeName", label: "اسم الموظف" },
          { key: "department", label: "القسم" },
          { key: "basicSalary", label: "الراتب الأساسي" },
          { key: "totalEarnings", label: "إجمالي المستحقات" },
          { key: "totalDeductions", label: "إجمالي الخصومات" },
          { key: "netSalary", label: "صافي الراتب" },
          { key: "status", label: "الحالة" }
        ];
        filename = `payroll_export_${new Date().toISOString().split("T")[0]}`;
        break;

      case "loans":
        const whereLoans: any = { tenantId };
        if (status) whereLoans.status = status;

        const loans = await prisma.loan.findMany({
          where: whereLoans,
          include: {
            employee: {
              select: {
                employeeNumber: true,
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
                department: { select: { name: true, nameAr: true } }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        });

        data = loans.map((loan) => ({
          loanNumber: loan.id.slice(0, 8),
          employeeNumber: loan.employee.employeeNumber || "",
          employeeName: `${loan.employee.firstNameAr || loan.employee.firstName} ${loan.employee.lastNameAr || loan.employee.lastName}`,
          department: loan.employee.department?.nameAr || loan.employee.department?.name || "",
          type: loan.type || "",
          amount: loan.amount?.toString() || "0",
          remainingAmount: loan.remainingAmount?.toString() || "0",
          installmentAmount: loan.installmentAmount?.toString() || "0",
          startDate: loan.startDate ? new Date(loan.startDate).toLocaleDateString("ar-SA") : "",
          endDate: loan.endDate ? new Date(loan.endDate).toLocaleDateString("ar-SA") : "",
          status: loan.status || "",
          reason: loan.reason || ""
        }));

        columns = [
          { key: "loanNumber", label: "رقم القرض" },
          { key: "employeeNumber", label: "رقم الموظف" },
          { key: "employeeName", label: "اسم الموظف" },
          { key: "department", label: "القسم" },
          { key: "type", label: "نوع القرض" },
          { key: "amount", label: "المبلغ" },
          { key: "remainingAmount", label: "المتبقي" },
          { key: "installmentAmount", label: "قيمة القسط" },
          { key: "startDate", label: "تاريخ البدء" },
          { key: "endDate", label: "تاريخ الانتهاء" },
          { key: "status", label: "الحالة" },
          { key: "reason", label: "السبب" }
        ];
        filename = `loans_export_${new Date().toISOString().split("T")[0]}`;
        break;

      default:
        return NextResponse.json({ error: "نوع التصدير غير مدعوم" }, { status: 400 });
    }

    // Return based on format
    if (format === "csv") {
      // Generate CSV
      const headers = columns.map((c) => c.label).join(",");
      const rows = data.map((row) =>
        columns.map((c) => `"${(row[c.key] || "").toString().replace(/"/g, '""')}"`).join(",")
      );
      const csv = [headers, ...rows].join("\n");

      // Add BOM for UTF-8 encoding
      const bom = "\uFEFF";
      const csvWithBom = bom + csv;

      return new NextResponse(csvWithBom, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`
        }
      });
    } else if (format === "excel-json") {
      // Return structured data for client-side Excel generation
      return NextResponse.json({
        filename: `${filename}.xlsx`,
        columns,
        data,
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: data.length,
          type
        }
      });
    }

    // Default: JSON format
    return NextResponse.json({
      filename: `${filename}.json`,
      columns,
      data,
      total: data.length
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "حدث خطأ في تصدير البيانات" }, { status: 500 });
  }
}
