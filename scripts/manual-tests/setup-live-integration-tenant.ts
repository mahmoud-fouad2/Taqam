import "dotenv/config";

import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";

import { Prisma } from "@prisma/client";

import prisma from "../../lib/db";

const TENANT_SLUG = "live-suite-20260411";
const CURRENT_YEAR = 2026;

const credentials = {
  admin: { email: "admin@live-suite.taqam.local", password: "Admin@123456" },
  hr: { email: "hr@live-suite.taqam.local", password: "Hr@123456" },
  manager: { email: "manager@live-suite.taqam.local", password: "Manager@123456" },
  employee: { email: "employee@live-suite.taqam.local", password: "Employee@123456" }
};

async function upsertTenant() {
  return prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: {
      name: "Live Integration Suite",
      nameAr: "بيئة اختبار التكامل الحي",
      plan: "PROFESSIONAL",
      maxEmployees: 100,
      status: "ACTIVE",
      timezone: "Asia/Riyadh",
      currency: "SAR"
    },
    create: {
      name: "Live Integration Suite",
      nameAr: "بيئة اختبار التكامل الحي",
      slug: TENANT_SLUG,
      plan: "PROFESSIONAL",
      maxEmployees: 100,
      status: "ACTIVE",
      timezone: "Asia/Riyadh",
      currency: "SAR",
      settings: {
        language: "ar",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "12h"
      }
    },
    select: {
      id: true,
      slug: true,
      name: true,
      nameAr: true
    }
  });
}

async function upsertUser(input: {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "TENANT_ADMIN" | "HR_MANAGER" | "MANAGER" | "EMPLOYEE";
}) {
  const passwordHash = await hash(input.password, 12);
  const userId = randomUUID();

  const rows = await prisma.$queryRaw<
    Array<{ id: string; email: string; role: string; tenantId: string | null }>
  >(Prisma.sql`
    INSERT INTO "User" (
      "id",
      "tenantId",
      "email",
      "password",
      "firstName",
      "lastName",
      "role",
      "status",
      "permissions",
      "failedLoginAttempts",
      "lockedUntil",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${userId},
      ${input.tenantId},
      ${input.email},
      ${passwordHash},
      ${input.firstName},
      ${input.lastName},
      ${input.role},
      ${"ACTIVE"},
      ${[]}::text[],
      0,
      ${null},
      NOW(),
      NOW()
    )
    ON CONFLICT ("email") DO UPDATE SET
      "tenantId" = EXCLUDED."tenantId",
      "password" = EXCLUDED."password",
      "firstName" = EXCLUDED."firstName",
      "lastName" = EXCLUDED."lastName",
      "role" = EXCLUDED."role",
      "status" = EXCLUDED."status",
      "permissions" = EXCLUDED."permissions",
      "failedLoginAttempts" = 0,
      "lockedUntil" = NULL,
      "updatedAt" = NOW()
    RETURNING "id", "email", "role", "tenantId"
  `);

  return rows[0]!;
}

async function main() {
  const tenant = await upsertTenant();

  await prisma.organizationProfile.upsert({
    where: { tenantId: tenant.id },
    update: {
      name: tenant.name,
      nameAr: tenant.nameAr,
      email: credentials.admin.email,
      phone: "+966500000111",
      country: "SA"
    },
    create: {
      tenantId: tenant.id,
      name: tenant.name,
      nameAr: tenant.nameAr,
      email: credentials.admin.email,
      phone: "+966500000111",
      country: "SA"
    },
    select: { id: true }
  });

  const department = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "OPS" } },
    update: {
      name: "Operations",
      nameAr: "العمليات",
      isActive: true
    },
    create: {
      tenantId: tenant.id,
      name: "Operations",
      nameAr: "العمليات",
      code: "OPS",
      isActive: true
    },
    select: { id: true }
  });

  const jobTitle = await prisma.jobTitle.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "OPS-GEN" } },
    update: {
      name: "Operations Specialist",
      nameAr: "أخصائي عمليات",
      isActive: true
    },
    create: {
      tenantId: tenant.id,
      name: "Operations Specialist",
      nameAr: "أخصائي عمليات",
      code: "OPS-GEN",
      level: 1,
      isActive: true
    },
    select: { id: true }
  });

  const shift = await prisma.shift.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "DAY" } },
    update: {
      name: "Day Shift",
      nameAr: "الوردية اليومية",
      startTime: "08:00",
      endTime: "16:00",
      breakStartTime: "12:00",
      breakEndTime: "13:00",
      breakDurationMinutes: 60,
      workDays: [0, 1, 2, 3, 4],
      isDefault: true,
      isActive: true
    },
    create: {
      tenantId: tenant.id,
      name: "Day Shift",
      nameAr: "الوردية اليومية",
      code: "DAY",
      startTime: "08:00",
      endTime: "16:00",
      breakStartTime: "12:00",
      breakEndTime: "13:00",
      breakDurationMinutes: 60,
      workDays: [0, 1, 2, 3, 4],
      isDefault: true,
      isActive: true
    },
    select: { id: true }
  });

  const annualLeave = await prisma.leaveType.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "ANNUAL" } },
    update: {
      name: "Annual Leave",
      nameAr: "إجازة سنوية",
      defaultDays: 21,
      isPaid: true,
      isActive: true
    },
    create: {
      tenantId: tenant.id,
      name: "Annual Leave",
      nameAr: "إجازة سنوية",
      code: "ANNUAL",
      defaultDays: 21,
      maxDays: 30,
      carryOverDays: 5,
      isPaid: true,
      isActive: true
    },
    select: { id: true }
  });

  const adminUser = await upsertUser({
    tenantId: tenant.id,
    email: credentials.admin.email,
    password: credentials.admin.password,
    firstName: "Admin",
    lastName: "Live Suite",
    role: "TENANT_ADMIN"
  });
  const hrUser = await upsertUser({
    tenantId: tenant.id,
    email: credentials.hr.email,
    password: credentials.hr.password,
    firstName: "Huda",
    lastName: "HR",
    role: "HR_MANAGER"
  });
  const managerUser = await upsertUser({
    tenantId: tenant.id,
    email: credentials.manager.email,
    password: credentials.manager.password,
    firstName: "Mazen",
    lastName: "Manager",
    role: "MANAGER"
  });
  const employeeUser = await upsertUser({
    tenantId: tenant.id,
    email: credentials.employee.email,
    password: credentials.employee.password,
    firstName: "Eman",
    lastName: "Employee",
    role: "EMPLOYEE"
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: "000001" } },
    update: {
      userId: adminUser.id,
      firstName: "Admin",
      lastName: "Live Suite",
      email: credentials.admin.email,
      departmentId: department.id,
      jobTitleId: jobTitle.id,
      shiftId: shift.id,
      hireDate: new Date("2026-01-01"),
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      nationality: "SA",
      baseSalary: 20000,
      currency: "SAR"
    },
    create: {
      tenantId: tenant.id,
      userId: adminUser.id,
      employeeNumber: "000001",
      firstName: "Admin",
      lastName: "Live Suite",
      email: credentials.admin.email,
      departmentId: department.id,
      jobTitleId: jobTitle.id,
      shiftId: shift.id,
      hireDate: new Date("2026-01-01"),
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      nationality: "SA",
      baseSalary: 20000,
      currency: "SAR"
    },
    select: { id: true }
  });

  const hrEmployee = await prisma.employee.upsert({
    where: { tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: "000002" } },
    update: {
      userId: hrUser.id,
      firstName: "Huda",
      lastName: "HR",
      email: credentials.hr.email,
      departmentId: department.id,
      jobTitleId: jobTitle.id,
      shiftId: shift.id,
      hireDate: new Date("2026-01-02"),
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      nationality: "SA",
      baseSalary: 12000,
      currency: "SAR"
    },
    create: {
      tenantId: tenant.id,
      userId: hrUser.id,
      employeeNumber: "000002",
      firstName: "Huda",
      lastName: "HR",
      email: credentials.hr.email,
      departmentId: department.id,
      jobTitleId: jobTitle.id,
      shiftId: shift.id,
      hireDate: new Date("2026-01-02"),
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      nationality: "SA",
      baseSalary: 12000,
      currency: "SAR"
    },
    select: { id: true }
  });

  const managerEmployee = await prisma.employee.upsert({
    where: { tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: "000003" } },
    update: {
      userId: managerUser.id,
      firstName: "Mazen",
      lastName: "Manager",
      email: credentials.manager.email,
      departmentId: department.id,
      jobTitleId: jobTitle.id,
      shiftId: shift.id,
      hireDate: new Date("2026-01-03"),
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      nationality: "SA",
      baseSalary: 9000,
      currency: "SAR"
    },
    create: {
      tenantId: tenant.id,
      userId: managerUser.id,
      employeeNumber: "000003",
      firstName: "Mazen",
      lastName: "Manager",
      email: credentials.manager.email,
      departmentId: department.id,
      jobTitleId: jobTitle.id,
      shiftId: shift.id,
      hireDate: new Date("2026-01-03"),
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      nationality: "SA",
      baseSalary: 9000,
      currency: "SAR"
    },
    select: { id: true }
  });

  const employee = await prisma.employee.upsert({
    where: { tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: "000004" } },
    update: {
      userId: employeeUser.id,
      firstName: "Eman",
      lastName: "Employee",
      email: credentials.employee.email,
      departmentId: department.id,
      jobTitleId: jobTitle.id,
      managerId: managerEmployee.id,
      shiftId: shift.id,
      hireDate: new Date("2026-01-04"),
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      nationality: "SA",
      baseSalary: 7000,
      currency: "SAR"
    },
    create: {
      tenantId: tenant.id,
      userId: employeeUser.id,
      employeeNumber: "000004",
      firstName: "Eman",
      lastName: "Employee",
      email: credentials.employee.email,
      departmentId: department.id,
      jobTitleId: jobTitle.id,
      managerId: managerEmployee.id,
      shiftId: shift.id,
      hireDate: new Date("2026-01-04"),
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      nationality: "SA",
      baseSalary: 7000,
      currency: "SAR"
    },
    select: { id: true }
  });

  for (const target of [adminEmployee, hrEmployee, managerEmployee, employee]) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: target.id,
          leaveTypeId: annualLeave.id,
          year: CURRENT_YEAR
        }
      },
      update: {
        entitled: 21,
        used: 0,
        pending: target.id === employee.id ? 2 : 0,
        carriedOver: 0,
        adjustment: 0
      },
      create: {
        tenantId: tenant.id,
        employeeId: target.id,
        leaveTypeId: annualLeave.id,
        year: CURRENT_YEAR,
        entitled: 21,
        used: 0,
        pending: target.id === employee.id ? 2 : 0,
        carriedOver: 0,
        adjustment: 0
      }
    });
  }

  const pendingLeaveStart = new Date("2026-04-14");
  const pendingLeaveEnd = new Date("2026-04-15");
  const existingLeave = await prisma.leaveRequest.findFirst({
    where: {
      tenantId: tenant.id,
      employeeId: employee.id,
      leaveTypeId: annualLeave.id,
      startDate: pendingLeaveStart,
      endDate: pendingLeaveEnd,
      reason: "Live integration pending leave"
    },
    select: { id: true }
  });

  if (!existingLeave) {
    await prisma.leaveRequest.create({
      data: {
        tenantId: tenant.id,
        employeeId: employee.id,
        leaveTypeId: annualLeave.id,
        startDate: pendingLeaveStart,
        endDate: pendingLeaveEnd,
        totalDays: 2,
        reason: "Live integration pending leave",
        status: "PENDING"
      }
    });
  }

  const payrollPeriod = await prisma.payrollPeriod.upsert({
    where: { id: `${TENANT_SLUG}-apr-2026` },
    update: {
      name: "April 2026 Payroll",
      nameAr: "رواتب أبريل 2026",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      paymentDate: new Date("2026-04-30"),
      status: "DRAFT"
    },
    create: {
      id: `${TENANT_SLUG}-apr-2026`,
      tenantId: tenant.id,
      name: "April 2026 Payroll",
      nameAr: "رواتب أبريل 2026",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      paymentDate: new Date("2026-04-30"),
      status: "DRAFT"
    },
    select: { id: true }
  });

  console.log(
    JSON.stringify(
      {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          payrollPeriodId: payrollPeriod.id
        },
        credentials,
        employeeIds: {
          admin: adminEmployee.id,
          hr: hrEmployee.id,
          manager: managerEmployee.id,
          employee: employee.id
        },
        leaveTypeId: annualLeave.id
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });