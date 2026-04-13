import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { requireTenantAccess } from "@/lib/auth";
import prisma from "@/lib/db";
import EmployeeDetailsClient from "./employee-details-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const EMPLOYEE_VIEW_ROLES = new Set(["TENANT_ADMIN", "HR_MANAGER", "MANAGER"]);

function mapEmployeeStatus(value: string | null | undefined) {
  switch (value) {
    case "ON_LEAVE":
      return "on_leave" as const;
    case "TERMINATED":
    case "SUSPENDED":
    case "RESIGNED":
      return "terminated" as const;
    case "ACTIVE":
    default:
      return "active" as const;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);

  return generateMeta({
    title: locale === "ar" ? "ملف الموظف" : "Employee Profile",
    description: t.employees.pManageEmployeeDataAndRecords
  });
}

export default async function EmployeeDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const locale = await getAppLocale();
  const currentUser = await requireTenantAccess();

  const employee = await prisma.employee.findFirst({
    where: {
      id,
      tenantId: currentUser.tenantId,
      deletedAt: null
    },
    select: {
      id: true,
      userId: true,
      employeeNumber: true,
      firstName: true,
      firstNameAr: true,
      lastName: true,
      lastNameAr: true,
      email: true,
      phone: true,
      avatar: true,
      nationalId: true,
      hireDate: true,
      employmentType: true,
      status: true,
      overtimeEligible: true,
      workLocation: true,
      baseSalary: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
      department: {
        select: {
          id: true,
          name: true,
          nameAr: true
        }
      },
      jobTitle: {
        select: {
          id: true,
          name: true,
          nameAr: true
        }
      },
      branch: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          city: true
        }
      },
      shift: {
        select: {
          id: true,
          name: true,
          nameAr: true
        }
      },
      manager: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true,
          email: true,
          avatar: true,
          jobTitle: {
            select: {
              name: true,
              nameAr: true
            }
          }
        }
      },
      directReports: {
        where: { deletedAt: null },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true,
          email: true,
          avatar: true,
          status: true,
          jobTitle: {
            select: {
              name: true,
              nameAr: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true
        }
      }
    }
  });

  if (!employee) {
    notFound();
  }

  const canView = EMPLOYEE_VIEW_ROLES.has(currentUser.role) || employee.userId === currentUser.id;

  if (!canView) {
    redirect("/dashboard?error=unauthorized");
  }

  const [recentPayslips, recentLoans, totalLoansCount, activeLoansCount, activeLoanTotals] =
    await Promise.all([
      prisma.payrollPayslip.findMany({
        where: {
          tenantId: currentUser.tenantId,
          employeeId: employee.id
        },
        orderBy: [{ payrollPeriod: { startDate: "desc" } }, { createdAt: "desc" }],
        take: 3,
        select: {
          id: true,
          status: true,
          netSalary: true,
          currency: true,
          overtimeHours: true,
          payrollPeriod: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              startDate: true,
              endDate: true,
              paymentDate: true
            }
          }
        }
      }),
      prisma.loan.findMany({
        where: {
          tenantId: currentUser.tenantId,
          employeeId: employee.id
        },
        orderBy: [{ createdAt: "desc" }],
        take: 3,
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          remainingAmount: true,
          installments: true,
          paidInstallments: true,
          createdAt: true,
          startDate: true,
          endDate: true
        }
      }),
      prisma.loan.count({
        where: {
          tenantId: currentUser.tenantId,
          employeeId: employee.id
        }
      }),
      prisma.loan.count({
        where: {
          tenantId: currentUser.tenantId,
          employeeId: employee.id,
          status: "ACTIVE"
        }
      }),
      prisma.loan.aggregate({
        where: {
          tenantId: currentUser.tenantId,
          employeeId: employee.id,
          status: "ACTIVE"
        },
        _sum: {
          remainingAmount: true
        }
      })
    ]);

  const employeeData = {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    firstNameAr: employee.firstNameAr ?? undefined,
    lastName: employee.lastName,
    lastNameAr: employee.lastNameAr ?? undefined,
    email: employee.email,
    phone: employee.phone ?? null,
    avatar: employee.avatar ?? null,
    nationalId: employee.nationalId ?? null,
    hireDate: employee.hireDate.toISOString(),
    employmentType: employee.employmentType,
    status: mapEmployeeStatus(employee.status),
    overtimeEligible: employee.overtimeEligible,
    workLocation: employee.workLocation ?? null,
    baseSalary: employee.baseSalary?.toString() ?? null,
    currency: employee.currency ?? "SAR",
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
    department: employee.department,
    jobTitle: employee.jobTitle,
    branch: employee.branch,
    shift: employee.shift,
    manager: employee.manager
      ? {
          ...employee.manager,
          firstNameAr: employee.manager.firstNameAr ?? undefined,
          lastNameAr: employee.manager.lastNameAr ?? undefined,
          email: employee.manager.email ?? null,
          avatar: employee.manager.avatar ?? null,
          employeeNumber: employee.manager.employeeNumber ?? null,
          jobTitle: employee.manager.jobTitle
        }
      : null,
    directReports: employee.directReports.map((report) => ({
      ...report,
      firstNameAr: report.firstNameAr ?? undefined,
      lastNameAr: report.lastNameAr ?? undefined,
      email: report.email ?? null,
      avatar: report.avatar ?? null,
      employeeNumber: report.employeeNumber ?? null,
      status: mapEmployeeStatus(report.status),
      jobTitle: report.jobTitle
    })),
    user: employee.user
      ? {
          ...employee.user,
          email: employee.user.email ?? null
        }
      : null,
    loanSummary: {
      totalCount: totalLoansCount,
      activeCount: activeLoansCount,
      activeRemainingAmount: Number(activeLoanTotals._sum.remainingAmount ?? 0)
    },
    recentLoans: recentLoans.map((loan) => ({
      id: loan.id,
      type: loan.type,
      status: loan.status,
      amount: Number(loan.amount),
      remainingAmount: Number(loan.remainingAmount),
      installments: loan.installments,
      paidInstallments: loan.paidInstallments,
      createdAt: loan.createdAt.toISOString(),
      startDate: loan.startDate?.toISOString() ?? null,
      endDate: loan.endDate?.toISOString() ?? null
    })),
    recentPayslips: recentPayslips.map((payslip) => ({
      id: payslip.id,
      status: payslip.status,
      netSalary: Number(payslip.netSalary),
      currency: payslip.currency,
      overtimeHours: payslip.overtimeHours,
      payrollPeriod: {
        id: payslip.payrollPeriod.id,
        name: payslip.payrollPeriod.name,
        nameAr: payslip.payrollPeriod.nameAr,
        startDate: payslip.payrollPeriod.startDate.toISOString(),
        endDate: payslip.payrollPeriod.endDate.toISOString(),
        paymentDate: payslip.payrollPeriod.paymentDate.toISOString()
      }
    }))
  };

  return (
    <EmployeeDetailsClient
      employee={employeeData}
      initialLocale={locale}
      canManageAvatar={currentUser.role === "TENANT_ADMIN" || currentUser.role === "HR_MANAGER"}
    />
  );
}
